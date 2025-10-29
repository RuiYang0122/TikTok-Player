from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import uuid
import threading
import time
import logging
from datetime import datetime
from shot_detector_video import BasketballShotDetector
from video_processor import VideoProcessor

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('basketball_highlight.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 配置
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
TEMP_FOLDER = 'temp'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB

# 创建必要的目录
for folder in [UPLOAD_FOLDER, OUTPUT_FOLDER, TEMP_FOLDER]:
    os.makedirs(folder, exist_ok=True)
    logger.info(f"确保目录存在: {folder}")

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
app.config['TEMP_FOLDER'] = TEMP_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# 全局任务存储
processing_tasks = {}

def allowed_file(filename):
    """检查文件扩展名是否被允许"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_file_size(file_path):
    """验证文件大小"""
    file_size = os.path.getsize(file_path)
    if file_size > MAX_FILE_SIZE:
        raise ValueError(f"文件大小 {file_size / (1024*1024):.1f}MB 超过限制 {MAX_FILE_SIZE / (1024*1024):.0f}MB")
    return file_size

@app.errorhandler(413)
def request_entity_too_large(error):
    """处理文件过大错误"""
    logger.warning(f"文件上传失败: 文件过大")
    return jsonify({
        'success': False,
        'error': f'文件大小超过限制 ({MAX_FILE_SIZE / (1024*1024):.0f}MB)'
    }), 413

@app.errorhandler(500)
def internal_server_error(error):
    """处理服务器内部错误"""
    logger.error(f"服务器内部错误: {error}")
    return jsonify({
        'success': False,
        'error': '服务器内部错误，请稍后重试'
    }), 500

@app.route('/api/upload', methods=['POST'])
def upload_video():
    """上传视频文件"""
    
    try:
        logger.info("收到视频上传请求")
        
        if 'video' not in request.files:
            logger.warning("上传请求中未找到视频文件")
            return jsonify({
                'success': False,
                'error': '未找到视频文件'
            }), 400
        
        file = request.files['video']
        
        if file.filename == '':
            logger.warning("上传请求中文件名为空")
            return jsonify({
                'success': False,
                'error': '未选择文件'
            }), 400
        
        if not allowed_file(file.filename):
            logger.warning(f"不支持的文件格式: {file.filename}")
            return jsonify({
                'success': False,
                'error': '不支持的文件格式，请上传mp4、avi、mov或mkv格式'
            }), 400
        
        # 生成唯一文件ID
        file_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}_{filename}")
        
        logger.info(f"开始保存文件: {filename} -> {file_path}")
        
        # 保存文件
        file.save(file_path)
        
        # 验证文件大小
        file_size = validate_file_size(file_path)
        
        logger.info(f"文件上传成功: {filename}, 大小: {file_size / (1024*1024):.1f}MB, ID: {file_id}")
        
        return jsonify({
            'success': True,
            'fileId': file_id,
            'filename': filename,
            'fileSize': file_size,
            'message': '视频上传成功'
        })
    
    except ValueError as e:
        # 文件大小验证错误
        logger.error(f"文件验证失败: {str(e)}")
        if os.path.exists(file_path):
            os.remove(file_path)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    
    except Exception as e:
        logger.error(f"文件上传失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'上传失败: {str(e)}'
        }), 500

@app.route('/api/process', methods=['POST'])
def process_video():
    """启动视频处理任务"""
    
    try:
        logger.info("收到视频处理请求")
        
        data = request.get_json()
        
        if not data or 'fileId' not in data:
            logger.warning("处理请求中缺少文件ID")
            return jsonify({
                'success': False,
                'error': '缺少文件ID'
            }), 400
        
        file_id = data['fileId']
        before_seconds = data.get('beforeSeconds', 8)
        after_seconds = data.get('afterSeconds', 2)
        
        # 验证参数
        if not isinstance(before_seconds, (int, float)) or before_seconds < 1 or before_seconds > 30:
            return jsonify({
                'success': False,
                'error': '进球前保留时间必须在1-30秒之间'
            }), 400
            
        if not isinstance(after_seconds, (int, float)) or after_seconds < 1 or after_seconds > 10:
            return jsonify({
                'success': False,
                'error': '进球后保留时间必须在1-10秒之间'
            }), 400
        
        # 查找上传的文件
        uploaded_files = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.startswith(file_id)]
        
        if not uploaded_files:
            logger.warning(f"找不到文件ID对应的文件: {file_id}")
            return jsonify({
                'success': False,
                'error': '找不到上传的文件'
            }), 404
        
        input_path = os.path.join(app.config['UPLOAD_FOLDER'], uploaded_files[0])
        
        # 验证文件是否存在且可读
        if not os.path.exists(input_path) or not os.access(input_path, os.R_OK):
            logger.error(f"文件不存在或不可读: {input_path}")
            return jsonify({
                'success': False,
                'error': '文件不存在或不可读'
            }), 404
        
        # 生成任务ID
        task_id = str(uuid.uuid4())
        
        logger.info(f"创建处理任务: {task_id}, 文件: {uploaded_files[0]}, 参数: before={before_seconds}s, after={after_seconds}s")
        
        # 初始化任务状态
        processing_tasks[task_id] = {
            'status': 'starting',
            'progress': 0,
            'stage': '准备处理',
            'result': None,
            'error': None,
            'created_at': time.time(),
            'file_id': file_id,
            'input_path': input_path,
            'before_seconds': before_seconds,
            'after_seconds': after_seconds
        }
        
        # 启动后台处理线程
        thread = threading.Thread(
            target=process_video_background,
            args=(task_id, input_path, before_seconds, after_seconds)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'success': True,
            'taskId': task_id,
            'message': '处理任务已启动'
        })
    
    except Exception as e:
        logger.error(f"启动处理任务失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'启动处理失败: {str(e)}'
        }), 500

def update_task_progress(task_id, **kwargs):
    """更新任务进度的辅助函数"""
    if task_id in processing_tasks:
        processing_tasks[task_id].update(kwargs)
        logger.info(f"任务 {task_id} 进度更新: {kwargs}")

def process_video_background(task_id, input_path, before_seconds, after_seconds):
    """后台处理视频的函数"""
    
    try:
        logger.info(f"开始后台处理任务: {task_id}")
        
        # 更新状态：开始检测
        update_task_progress(task_id, 
            status='detecting',
            progress=10,
            stage='正在检测进球时刻...'
        )
        
        # 检查模型文件是否存在
        model_path = 'best.pt'
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"AI模型文件不存在: {model_path}")
        
        # 初始化检测器
        logger.info(f"初始化篮球检测器，模型: {model_path}")
        detector = BasketballShotDetector(model_path=model_path)
        
        # 进度回调函数
        def progress_callback(current_frame, total_frames):
            if task_id in processing_tasks:
                progress = 10 + int((current_frame / total_frames) * 60)  # 10-70%
                update_task_progress(task_id,
                    progress=progress,
                    stage=f'正在分析视频... ({current_frame}/{total_frames})'
                )
        
        # 检测进球
        logger.info(f"开始检测进球，文件: {input_path}")
        result = detector.detect_shots_with_clips(
            input_path, 
            before_seconds=before_seconds, 
            after_seconds=after_seconds,
            progress_callback=progress_callback
        )
        
        logger.info(f"检测完成，结果: 总投篮 {result['stats']['total_attempts']}, 进球 {result['stats']['total_makes']}, 命中率 {result['stats']['accuracy']:.1f}%")
        
        # 更新状态：开始生成集锦
        update_task_progress(task_id,
            status='generating',
            progress=75,
            stage='正在生成集锦视频...'
        )
        
        # 生成输出文件名
        output_filename = f"{task_id}_highlight.mp4"
        output_path = os.path.join(app.config['OUTPUT_FOLDER'], output_filename)
        
        # 处理视频：生成集锦
        processor = VideoProcessor()
        
        if result['made_shots']:
            # 有进球，生成集锦
            logger.info(f"生成集锦视频，进球数量: {len(result['made_shots'])}")
            video_result = processor.process_video_full_pipeline(
                video_path=input_path,
                timestamps=result['made_shots'],
                output_path=output_path,
                before=before_seconds,
                after=after_seconds
            )
            
            if not video_result['success']:
                raise Exception(video_result['error'])
            
            # 验证输出文件
            if not os.path.exists(output_path):
                raise Exception("集锦视频生成失败，输出文件不存在")
            
            file_size = os.path.getsize(output_path)
            logger.info(f"集锦视频生成成功: {output_path}, 大小: {file_size / (1024*1024):.1f}MB")
            
            # 更新状态：完成
            update_task_progress(task_id,
                status='completed',
                progress=100,
                stage='处理完成',
                result={
                    'totalShots': result['stats']['total_attempts'],
                    'madeShots': result['stats']['total_makes'],
                    'accuracy': result['stats']['accuracy'],
                    'highlightVideo': output_filename,
                    'timestamps': result['made_shots'],
                    'fileSize': file_size
                }
            )
        else:
            # 没有检测到进球
            logger.info("未检测到进球")
            update_task_progress(task_id,
                status='completed',
                progress=100,
                stage='处理完成',
                result={
                    'totalShots': result['stats']['total_attempts'],
                    'madeShots': result['stats']['total_makes'],
                    'accuracy': result['stats']['accuracy'],
                    'highlightVideo': None,
                    'message': '未检测到进球，请检查视频内容或调整参数'
                }
            )
        
        # 清理上传的文件
        try:
            os.remove(input_path)
            logger.info(f"清理上传文件: {input_path}")
        except Exception as e:
            logger.warning(f"清理上传文件失败: {e}")
            
    except Exception as e:
        # 处理错误
        error_msg = str(e)
        logger.error(f"任务 {task_id} 处理失败: {error_msg}")
        update_task_progress(task_id,
            status='failed',
            progress=0,
            stage='处理失败',
            error=error_msg
        )

@app.route('/api/progress/<task_id>', methods=['GET'])
def get_progress(task_id):
    """获取处理进度"""
    
    try:
        if task_id not in processing_tasks:
            logger.warning(f"查询不存在的任务: {task_id}")
            return jsonify({
                'success': False,
                'error': '任务不存在'
            }), 404
        
        task = processing_tasks[task_id]
        
        response = {
            'progress': task['progress'],
            'stage': task['stage'],
            'status': task['status'],
            'completed': task['status'] in ['completed', 'failed']
        }
        
        if task['status'] == 'completed' and task['result']:
            response['result'] = task['result']
        elif task['status'] == 'failed' and task['error']:
            response['error'] = task['error']
        
        return jsonify(response)
    
    except Exception as e:
        logger.error(f"获取任务进度失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': '获取进度失败'
        }), 500

@app.route('/api/download/<filename>', methods=['GET'])
def download_video(filename):
    """下载生成的集锦视频"""
    
    try:
        # 安全检查文件名
        if not filename or '..' in filename or '/' in filename or '\\' in filename:
            logger.warning(f"非法文件名访问: {filename}")
            return jsonify({
                'success': False,
                'error': '非法文件名'
            }), 400
        
        file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
        
        if not os.path.exists(file_path):
            logger.warning(f"下载文件不存在: {file_path}")
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        logger.info(f"开始下载文件: {filename}")
        
        return send_file(
            file_path, 
            as_attachment=True,
            download_name=f"basketball_highlight_{filename}"
        )
    
    except Exception as e:
        logger.error(f"文件下载失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': '下载失败'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    try:
        # 检查关键组件
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'message': '篮球集锦生成服务运行正常',
            'components': {
                'upload_folder': os.path.exists(UPLOAD_FOLDER),
                'output_folder': os.path.exists(OUTPUT_FOLDER),
                'model_file': os.path.exists('best.pt'),
                'active_tasks': len(processing_tasks)
            }
        }
        
        # 检查是否有组件异常
        if not all(health_status['components'].values()):
            health_status['status'] = 'degraded'
            health_status['message'] = '部分组件异常'
        
        return jsonify(health_status)
    
    except Exception as e:
        logger.error(f"健康检查失败: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'message': f'健康检查失败: {str(e)}'
        }), 500

# 清理过期任务的定时任务
def cleanup_old_tasks():
    """清理超过1小时的旧任务"""
    try:
        current_time = time.time()
        expired_tasks = [
            task_id for task_id, task in processing_tasks.items()
            if current_time - task['created_at'] > 3600  # 1小时
        ]
        
        for task_id in expired_tasks:
            del processing_tasks[task_id]
            logger.info(f"清理过期任务: {task_id}")
        
        if expired_tasks:
            logger.info(f"清理了 {len(expired_tasks)} 个过期任务")
    
    except Exception as e:
        logger.error(f"清理过期任务失败: {str(e)}")

# 启动清理定时器
def start_cleanup_timer():
    cleanup_old_tasks()
    timer = threading.Timer(1800, start_cleanup_timer)  # 每30分钟清理一次
    timer.daemon = True
    timer.start()

if __name__ == '__main__':
    start_cleanup_timer()
    logger.info("🏀 篮球集锦生成服务启动中...")
    logger.info("📡 API服务地址: http://localhost:5000")
    logger.info("📋 健康检查: http://localhost:5000/api/health")
    app.run(debug=True, host='0.0.0.0', port=5000)



