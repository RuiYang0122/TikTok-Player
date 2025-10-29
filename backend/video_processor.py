# video_processor.py - 视频处理模块
import cv2
import subprocess
import os
import tempfile
from typing import List, Dict
import shutil

class VideoProcessor:
    """
    视频剪辑和拼接处理器
    """
    
    def __init__(self, temp_dir=None):
        """
        初始化视频处理器
        
        Args:
            temp_dir: 临时文件目录，如果为None则使用系统临时目录
        """
        self.temp_dir = temp_dir or tempfile.gettempdir()
        os.makedirs(self.temp_dir, exist_ok=True)
        
        # 检查FFmpeg是否可用
        self._check_ffmpeg()
    
    def _check_ffmpeg(self):
        """检查FFmpeg是否已安装"""
        try:
            result = subprocess.run(
                ['ffmpeg', '-version'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=5
            )
            if result.returncode == 0:
                print("✓ FFmpeg 已就绪")
            else:
                raise Exception("FFmpeg 未正确安装")
        except FileNotFoundError:
            raise Exception("未找到 FFmpeg，请先安装 FFmpeg")
        except Exception as e:
            raise Exception(f"FFmpeg 检查失败: {str(e)}")
    
    def extract_clips(self, video_path: str, timestamps: List[Dict], 
                     before: float = 8, after: float = 2, 
                     progress_callback=None) -> List[str]:
        """
        提取每个进球的视频片段
        
        Args:
            video_path: 原始视频路径
            timestamps: 进球时间戳列表 [{'frame': x, 'timestamp': y, 'made': True}, ...]
            before: 进球前保留的秒数
            after: 进球后保留的秒数
            progress_callback: 进度回调函数
        
        Returns:
            剪辑文件路径列表
        """
        # 只处理进球的片段
        made_shots = [ts for ts in timestamps if ts.get('made', False)]
        
        if not made_shots:
            print("⚠️  没有检测到进球，无法生成集锦")
            return []
        
        print(f"开始提取 {len(made_shots)} 个进球片段...")
        
        # 获取视频信息
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = cap.get(cv2.CAP_PROP_FRAME_COUNT) / fps
        cap.release()
        
        clips = []
        
        for idx, shot in enumerate(made_shots):
            # 计算剪辑时间
            shot_time = shot['timestamp']
            start_time = max(0, shot_time - before)
            end_time = min(duration, shot_time + after)
            clip_duration = end_time - start_time
            
            # 生成临时文件名
            clip_filename = f"clip_{idx:03d}_{shot['frame']}.mp4"
            clip_path = os.path.join(self.temp_dir, clip_filename)
            
            print(f"  提取片段 {idx + 1}/{len(made_shots)}: "
                  f"{start_time:.2f}s - {end_time:.2f}s "
                  f"(时长: {clip_duration:.2f}s)")
            
            try:
                # 使用FFmpeg精确剪辑
                # -ss 放在 -i 前面可以加快处理速度（快速定位）
                # -accurate_seek 确保精确定位
                cmd = [
                    'ffmpeg',
                    '-y',  # 覆盖已存在的文件
                    '-ss', str(start_time),  # 开始时间
                    '-i', video_path,  # 输入文件
                    '-t', str(clip_duration),  # 持续时间
                    '-c:v', 'libx264',  # 视频编码器
                    '-preset', 'medium',  # 编码速度
                    '-crf', '23',  # 质量（18-28，值越小质量越高）
                    '-c:a', 'aac',  # 音频编码器
                    '-b:a', '128k',  # 音频比特率
                    '-avoid_negative_ts', 'make_zero',  # 避免时间戳问题
                    clip_path
                ]
                
                result = subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=60,  # 超时设置
                    check=True
                )
                
                # 验证文件是否生成
                if os.path.exists(clip_path) and os.path.getsize(clip_path) > 0:
                    clips.append(clip_path)
                    print(f"    ✓ 片段 {idx + 1} 提取成功")
                else:
                    print(f"    ✗ 片段 {idx + 1} 生成失败")
                
                # 进度回调
                if progress_callback:
                    progress_callback(idx + 1, len(made_shots))
                    
            except subprocess.TimeoutExpired:
                print(f"    ✗ 片段 {idx + 1} 处理超时")
            except subprocess.CalledProcessError as e:
                print(f"    ✗ 片段 {idx + 1} FFmpeg错误: {e.stderr.decode()[:200]}")
            except Exception as e:
                print(f"    ✗ 片段 {idx + 1} 未知错误: {str(e)}")
        
        print(f"✓ 成功提取 {len(clips)}/{len(made_shots)} 个片段")
        return clips
    
    def concatenate_clips(self, clips: List[str], output_path: str,
                         add_transitions: bool = False) -> bool:
        """
        拼接所有视频片段
        
        Args:
            clips: 片段文件路径列表
            output_path: 输出文件路径
            add_transitions: 是否添加转场效果（淡入淡出）
        
        Returns:
            是否成功
        """
        if not clips:
            print("⚠️  没有可拼接的片段")
            return False
        
        print(f"\n开始拼接 {len(clips)} 个片段...")
        
        # 创建文件列表
        list_file = os.path.join(self.temp_dir, 'concat_list.txt')
        
        try:
            with open(list_file, 'w', encoding='utf-8') as f:
                for clip in clips:
                    # 使用正斜杠（即使在Windows上也能工作）
                    abs_path = os.path.abspath(clip).replace('\\', '/')
                    f.write(f"file '{abs_path}'\n")
            
            print(f"  生成文件列表: {list_file}")
            
            # 调试：打印文件列表内容
            with open(list_file, 'r', encoding='utf-8') as f:
                print("  文件列表内容:")
                for line in f:
                    print(f"    {line.strip()}")
            
            # 拼接命令
            if add_transitions:
                # 使用xfade滤镜添加转场（更复杂，暂时不实现）
                print("  注意：转场效果暂未实现，使用直接拼接")
            
            # 如果只有一个片段，直接复制文件
            if len(clips) == 1:
                print("  只有一个片段，直接复制...")
                shutil.copy2(clips[0], output_path)
                
                if os.path.exists(output_path):
                    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
                    print(f"✓ 复制完成: {output_path}")
                    print(f"  文件大小: {file_size_mb:.2f} MB")
                    return True
                else:
                    print("✗ 复制失败")
                    return False
            
            # 多个片段时使用concat
            cmd = [
                'ffmpeg',
                '-y',
                '-f', 'concat',  # 使用concat demuxer
                '-safe', '0',  # 允许使用绝对路径
                '-i', list_file,
                '-c:v', 'libx264',  # 重新编码视频
                '-preset', 'medium',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                output_path
            ]
            
            print("  执行拼接...")
            print(f"  FFmpeg命令: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=300,  # 5分钟超时
            )
            
            # 显示完整的FFmpeg输出（用于调试）
            if result.returncode != 0:
                stderr_output = result.stderr.decode('utf-8', errors='ignore')
                print(f"\n完整FFmpeg错误输出:")
                print(stderr_output)
                raise subprocess.CalledProcessError(result.returncode, cmd, result.stdout, result.stderr)
            
            # 验证输出文件
            if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
                print(f"✓ 拼接完成: {output_path}")
                print(f"  文件大小: {file_size_mb:.2f} MB")
                return True
            else:
                print("✗ 拼接失败：输出文件无效")
                return False
                
        except subprocess.TimeoutExpired:
            print("✗ 拼接超时")
            return False
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode('utf-8', errors='ignore') if e.stderr else str(e)
            print(f"✗ FFmpeg拼接错误（完整输出）:")
            print(error_msg)
            return False
        except Exception as e:
            print(f"✗ 拼接失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
        finally:
            # 清理文件列表
            if os.path.exists(list_file):
                os.remove(list_file)
    
    def cleanup_clips(self, clips: List[str]):
        """清理临时片段文件"""
        print("\n清理临时文件...")
        cleaned = 0
        for clip in clips:
            try:
                if os.path.exists(clip):
                    os.remove(clip)
                    cleaned += 1
            except Exception as e:
                print(f"  ⚠️  无法删除 {clip}: {str(e)}")
        
        print(f"✓ 清理了 {cleaned}/{len(clips)} 个临时文件")
    
    def process_video_full_pipeline(self, video_path: str, timestamps: List[Dict],
                                    output_path: str, before: float = 8, after: float = 2) -> Dict:
        """
        完整的处理流程：检测 -> 剪辑 -> 拼接
        
        Args:
            video_path: 输入视频路径
            timestamps: 进球时间戳列表
            output_path: 输出视频路径
            before: 进球前保留秒数
            after: 进球后保留秒数
        
        Returns:
            处理结果字典
        """
        print("=" * 60)
        print("开始完整视频处理流程")
        print("=" * 60)
        
        result = {
            'success': False,
            'clips_extracted': 0,
            'output_file': None,
            'error': None
        }
        
        try:
            # 步骤1: 提取片段
            clips = self.extract_clips(video_path, timestamps, before, after)
            result['clips_extracted'] = len(clips)
            
            if not clips:
                result['error'] = "没有成功提取任何片段"
                return result
            
            # 步骤2: 拼接片段
            success = self.concatenate_clips(clips, output_path)
            
            if success:
                result['success'] = True
                result['output_file'] = output_path
            else:
                result['error'] = "拼接失败"
            
            # 步骤3: 清理临时文件
            self.cleanup_clips(clips)
            
        except Exception as e:
            result['error'] = str(e)
            print(f"\n✗ 处理失败: {str(e)}")
        
        print("=" * 60)
        return result


# 测试代码
if __name__ == "__main__":
    # 模拟测试数据
    test_timestamps = [
        {'frame': 120, 'timestamp': 4.0, 'made': True},
        {'frame': 360, 'timestamp': 12.0, 'made': True},
        {'frame': 600, 'timestamp': 20.0, 'made': True},
    ]
    
    processor = VideoProcessor()
    
    # 测试完整流程
    result = processor.process_video_full_pipeline(
        video_path='test_video.mp4',
        timestamps=test_timestamps,
        output_path='highlight_output.mp4',
        before=8,
        after=2
    )
    
    print("\n最终结果:")
    print(f"  成功: {result['success']}")
    print(f"  提取片段数: {result['clips_extracted']}")
    print(f"  输出文件: {result['output_file']}")
    if result['error']:
        print(f"  错误: {result['error']}")