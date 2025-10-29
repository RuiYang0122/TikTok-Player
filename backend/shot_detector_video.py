# basketball_shot_detector.py - 批量进球检测模块
from ultralytics import YOLO
import cv2
import math
import numpy as np
from utils import (
    score, detect_down, detect_up, in_hoop_region, 
    clean_hoop_pos, clean_ball_pos, get_device
)
from typing import List, Dict

class BasketballShotDetector:
    """
    批量处理篮球视频，检测所有进球时刻
    """
    def __init__(self, model_path='best.pt', confidence_threshold=0.25):
        """
        初始化检测器
        
        Args:
            model_path: YOLO模型文件路径
            confidence_threshold: 检测置信度阈值
        """
        self.model = YOLO(model_path)
        self.class_names = ['Basketball', 'Basketball Hoop']
        self.device = get_device()
        self.confidence_threshold = confidence_threshold
        
        print(f"使用设备: {self.device}")
        print(f"模型加载完成: {model_path}")
    
    def detect_shots(self, video_path: str, progress_callback=None) -> List[Dict]:
        """
        检测视频中的所有进球
        
        Args:
            video_path: 视频文件路径
            progress_callback: 进度回调函数 callback(current_frame, total_frames)
        
        Returns:
            进球列表，格式: [
                {
                    'frame': 帧数,
                    'timestamp': 时间戳（秒）,
                    'made': True/False (是否进球)
                },
                ...
            ]
        """
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            raise ValueError(f"无法打开视频文件: {video_path}")
        
        # 获取视频信息
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        print(f"视频信息 - FPS: {fps}, 总帧数: {total_frames}")
        
        # 初始化追踪变量
        ball_pos = []
        hoop_pos = []
        frame_count = 0
        
        # 投篮检测变量
        up = False
        down = False
        up_frame = 0
        down_frame = 0
        
        # 结果存储
        shot_results = []
        makes = 0
        attempts = 0
        
        while True:
            ret, frame = cap.read()
            
            if not ret:
                break
            
            # 运行YOLO检测
            results = self.model(frame, stream=True, device=self.device, verbose=False)
            
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    # 边界框
                    x1, y1, x2, y2 = box.xyxy[0]
                    x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                    w, h = x2 - x1, y2 - y1
                    
                    # 置信度
                    conf = math.ceil((box.conf[0] * 100)) / 100
                    
                    # 类别
                    cls = int(box.cls[0])
                    current_class = self.class_names[cls]
                    
                    center = (int(x1 + w / 2), int(y1 + h / 2))
                    
                    # 检测篮球
                    if (conf > self.confidence_threshold or 
                        (in_hoop_region(center, hoop_pos) and conf > 0.15)) and \
                        current_class == "Basketball":
                        ball_pos.append((center, frame_count, w, h, conf))
                    
                    # 检测篮筐
                    if conf > 0.3 and current_class == "Basketball Hoop":
                        hoop_pos.append((center, frame_count, w, h, conf))
            
            # 清理位置数据
            ball_pos = clean_ball_pos(ball_pos, frame_count)
            if len(hoop_pos) > 1:
                hoop_pos = clean_hoop_pos(hoop_pos)
            
            # 投篮检测逻辑
            if len(hoop_pos) > 0 and len(ball_pos) > 0:
                # 检测球在上方区域
                if not up:
                    up = detect_up(ball_pos, hoop_pos)
                    if up:
                        up_frame = ball_pos[-1][1]
                
                # 检测球在下方区域
                if up and not down:
                    down = detect_down(ball_pos, hoop_pos)
                    if down:
                        down_frame = ball_pos[-1][1]
                
                # 判断是否完成一次投篮
                if frame_count % 10 == 0:
                    if up and down and up_frame < down_frame:
                        attempts += 1
                        
                        # 判断是否进球
                        is_made = score(ball_pos, hoop_pos)
                        
                        if is_made:
                            makes += 1
                        
                        # 记录这次投篮
                        shot_results.append({
                            'frame': down_frame,
                            'timestamp': round(down_frame / fps, 2),
                            'made': is_made
                        })
                        
                        print(f"检测到投篮 #{attempts} - "
                              f"帧: {down_frame}, "
                              f"时间: {down_frame/fps:.2f}s, "
                              f"{'进球' if is_made else '未进'}")
                        
                        # 重置检测标志
                        up = False
                        down = False
            
            frame_count += 1
            
            # 进度回调
            if progress_callback and frame_count % 30 == 0:
                progress_callback(frame_count, total_frames)
        
        cap.release()
        
        # 打印统计信息
        accuracy = (makes / attempts * 100) if attempts > 0 else 0
        print(f"\n检测完成:")
        print(f"  总投篮次数: {attempts}")
        print(f"  进球次数: {makes}")
        print(f"  命中率: {accuracy:.2f}%")
        print(f"  检测到的进球时刻: {len([s for s in shot_results if s['made']])}")
        
        return shot_results
    
    def detect_shots_with_clips(self, video_path: str, before_seconds=8, after_seconds=2, progress_callback=None) -> Dict:
        """
        检测进球并返回每个进球的剪辑时间段
        
        Args:
            video_path: 视频文件路径
            before_seconds: 进球前保留的秒数
            after_seconds: 进球后保留的秒数
            progress_callback: 进度回调函数 callback(current_frame, total_frames)
        
        Returns:
            {
                'shots': 所有投篮列表,
                'made_shots': 只包含进球的列表,
                'clips': 剪辑时间段列表 [(start_time, end_time), ...]
                'stats': 统计信息
            }
        """
        # 检测所有投篮
        all_shots = self.detect_shots(video_path, progress_callback)
        
        # 筛选出进球
        made_shots = [shot for shot in all_shots if shot['made']]
        
        # 计算剪辑时间段
        cap = cv2.VideoCapture(video_path)
        duration = cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS)
        cap.release()
        
        clips = []
        for shot in made_shots:
            start_time = max(0, shot['timestamp'] - before_seconds)
            end_time = min(duration, shot['timestamp'] + after_seconds)
            clips.append({
                'start': start_time,
                'end': end_time,
                'shot_frame': shot['frame'],
                'shot_timestamp': shot['timestamp']
            })
        
        # 统计信息
        total_attempts = len(all_shots)
        total_makes = len(made_shots)
        accuracy = (total_makes / total_attempts * 100) if total_attempts > 0 else 0
        
        return {
            'shots': all_shots,
            'made_shots': made_shots,
            'clips': clips,
            'stats': {
                'total_attempts': total_attempts,
                'total_makes': total_makes,
                'accuracy': round(accuracy, 2)
            }
        }


# 测试代码
if __name__ == "__main__":
    # 使用示例
    detector = BasketballShotDetector(model_path='D:/basketball-highlight-generator/backend/best.pt')
    
    # 测试视频路径
    test_video = "D:/basketball-highlight-generator/backend/test_files/video_test_1.mp4"
    
    # 检测并输出剪辑信息
    print("\n" + "=" * 50)
    print("检测进球并生成剪辑信息")
    print("=" * 50)
    result = detector.detect_shots_with_clips(test_video, before_seconds=8, after_seconds=2)
    
    print(f"\n统计:")
    print(f"  总投篮: {result['stats']['total_attempts']}")
    print(f"  进球数: {result['stats']['total_makes']}")
    print(f"  命中率: {result['stats']['accuracy']}%")
    print(f"\n需要剪辑的片段数: {len(result['clips'])}")
    
    for i, clip in enumerate(result['clips'], 1):
        print(f"  片段 {i}: {clip['start']:.2f}s - {clip['end']:.2f}s")