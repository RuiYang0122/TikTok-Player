# utils.py - 工具函数库
import math
import cv2
import numpy as np
import torch
import os
from typing import List, Tuple, Dict
import json

def get_device():
    """自动检测并返回最佳计算设备"""
    if torch.cuda.is_available():
        return 'cuda'
    elif torch.backends.mps.is_available():  # Apple Silicon
        return 'mps'
    else:
        return 'cpu'

def calculate_distance(pos1: Tuple[int, int], pos2: Tuple[int, int]) -> float:
    """计算两点之间的欧氏距离"""
    return np.sqrt((pos1[0] - pos2[0])**2 + (pos1[1] - pos2[1])**2)

# def clean_ball_pos(ball_positions: List, current_frame: int, max_frames: int = 50) -> List:
#     """
#     清理球的位置数据
#     - 移除旧的位置（超过 max_frames 帧）
#     - 移除异常点（距离前一个点太远）
#     """
#     if not ball_positions:
#         return ball_positions
    
#     # 移除过旧的位置
#     ball_positions = [pos for pos in ball_positions if current_frame - pos[1] < max_frames]
    
#     # 移除异常点
#     cleaned = []
#     for i, pos in enumerate(ball_positions):
#         if i == 0:
#             cleaned.append(pos)
#             continue
        
#         # 检查距离
#         dist = calculate_distance(pos[0], cleaned[-1][0])
#         if dist < 200:  # 像素阈值
#             cleaned.append(pos)
    
#     return cleaned

# def clean_hoop_pos(hoop_positions: List) -> List:
#     """
#     清理篮筐位置数据（篮筐通常是静止的）
#     返回平均位置
#     """
#     if not hoop_positions:
#         return hoop_positions
    
#     # 计算平均位置
#     avg_x = int(np.mean([pos[0][0] for pos in hoop_positions]))
#     avg_y = int(np.mean([pos[0][1] for pos in hoop_positions]))
    
#     # 返回最后一个位置但使用平均坐标
#     last_pos = hoop_positions[-1]
#     return [((avg_x, avg_y), last_pos[1], last_pos[2], last_pos[3], last_pos[4])]


# Removes inaccurate data points
def clean_ball_pos(ball_pos, frame_count):
    # Removes inaccurate ball size to prevent jumping to wrong ball
    if len(ball_pos) > 1:
        # Width and Height
        w1 = ball_pos[-2][2]
        h1 = ball_pos[-2][3]
        w2 = ball_pos[-1][2]
        h2 = ball_pos[-1][3]

        # X and Y coordinates
        x1 = ball_pos[-2][0][0]
        y1 = ball_pos[-2][0][1]
        x2 = ball_pos[-1][0][0]
        y2 = ball_pos[-1][0][1]

        # Frame count
        f1 = ball_pos[-2][1]
        f2 = ball_pos[-1][1]
        f_dif = f2 - f1

        dist = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

        max_dist = 4 * math.sqrt((w1) ** 2 + (h1) ** 2)

        # Ball should not move a 4x its diameter within 5 frames
        if (dist > max_dist) and (f_dif < 5):
            ball_pos.pop()

        # Ball should be relatively square
        elif (w2*1.4 < h2) or (h2*1.4 < w2):
            ball_pos.pop()

    # Remove points older than 30 frames
    if len(ball_pos) > 0:
        if frame_count - ball_pos[0][1] > 30:
            ball_pos.pop(0)

    return ball_pos


def clean_hoop_pos(hoop_pos):
    # Prevents jumping from one hoop to another
    if len(hoop_pos) > 1:
        x1 = hoop_pos[-2][0][0]
        y1 = hoop_pos[-2][0][1]
        x2 = hoop_pos[-1][0][0]
        y2 = hoop_pos[-1][0][1]

        w1 = hoop_pos[-2][2]
        h1 = hoop_pos[-2][3]
        w2 = hoop_pos[-1][2]
        h2 = hoop_pos[-1][3]

        f1 = hoop_pos[-2][1]
        f2 = hoop_pos[-1][1]

        f_dif = f2-f1

        dist = math.sqrt((x2-x1)**2 + (y2-y1)**2)

        max_dist = 0.5 * math.sqrt(w1 ** 2 + h1 ** 2)

        # Hoop should not move 0.5x its diameter within 5 frames
        if dist > max_dist and f_dif < 5:
            hoop_pos.pop()

        # Hoop should be relatively square
        if (w2*1.3 < h2) or (h2*1.3 < w2):
            hoop_pos.pop()

    # Remove old points
    if len(hoop_pos) > 25:
        hoop_pos.pop(0)

    return hoop_pos



# def detect_up(ball_positions: List, hoop_pos: Tuple[int, int]) -> bool:
#     """
#     检测球是否在篮筐上方区域
#     """
#     if not ball_positions:
#         return False
    
#     latest_ball = ball_positions[-1][0]
    
#     # 球的 y 坐标小于篮筐（图像坐标系中，上方 y 值更小）
#     is_above = latest_ball[1] < hoop_pos[1] - 50
    
#     # 球的 x 坐标在篮筐附近
#     is_near_horizontal = abs(latest_ball[0] - hoop_pos[0]) < 100
    
#     return is_above and is_near_horizontal

# def detect_down(ball_positions: List, hoop_pos: Tuple[int, int]) -> bool:
#     """
#     检测球是否在篮筐下方区域
#     """
#     if not ball_positions:
#         return False
    
#     latest_ball = ball_positions[-1][0]
    
#     # 球的 y 坐标大于篮筐
#     is_below = latest_ball[1] > hoop_pos[1] + 20
    
#     # 球的 x 坐标在篮筐附近
#     is_near_horizontal = abs(latest_ball[0] - hoop_pos[0]) < 100
    
#     return is_below and is_near_horizontal


# Detects if the ball is below the net - used to detect shot attempts
def detect_down(ball_pos, hoop_pos):
    y = hoop_pos[-1][0][1] + 0.5 * hoop_pos[-1][3]
    if ball_pos[-1][0][1] > y:
        return True
    return False


# Detects if the ball is around the backboard - used to detect shot attempts
def detect_up(ball_pos, hoop_pos):
    x1 = hoop_pos[-1][0][0] - 4 * hoop_pos[-1][2]
    x2 = hoop_pos[-1][0][0] + 4 * hoop_pos[-1][2]
    y1 = hoop_pos[-1][0][1] - 2 * hoop_pos[-1][3]
    y2 = hoop_pos[-1][0][1]

    if x1 < ball_pos[-1][0][0] < x2 and y1 < ball_pos[-1][0][1] < y2 - 0.5 * hoop_pos[-1][3]:
        return True
    return False


# def in_hoop_region(ball_pos: Tuple[int, int], hoop_pos: Tuple[int, int], threshold: int = 50) -> bool:
#     """
#     检测球是否在篮筐区域内
#     """
#     horizontal_dist = abs(ball_pos[0] - hoop_pos[0])
#     vertical_dist = abs(ball_pos[1] - hoop_pos[1])
    
#     return horizontal_dist < threshold and vertical_dist < threshold

# Checks if center point is near the hoop
def in_hoop_region(center, hoop_pos):
    if len(hoop_pos) < 1:
        return False
    x = center[0]
    y = center[1]

    x1 = hoop_pos[-1][0][0] - 1 * hoop_pos[-1][2]
    x2 = hoop_pos[-1][0][0] + 1 * hoop_pos[-1][2]
    y1 = hoop_pos[-1][0][1] - 1 * hoop_pos[-1][3]
    y2 = hoop_pos[-1][0][1] + 0.5 * hoop_pos[-1][3]

    if x1 < x < x2 and y1 < y < y2:
        return True
    return False

def fit_parabola(positions: List[Tuple[int, int]]) -> np.ndarray:
    """
    拟合抛物线轨迹
    返回二次多项式系数 [a, b, c] for y = ax² + bx + c
    """
    if len(positions) < 3:
        return None
    
    x = np.array([pos[0] for pos in positions])
    y = np.array([pos[1] for pos in positions])
    
    try:
        # 二次多项式拟合
        coeffs = np.polyfit(x, y, 2)
        return coeffs
    except:
        return None

def predict_trajectory(coeffs: np.ndarray, x_range: np.ndarray) -> np.ndarray:
    """
    根据拟合系数预测轨迹
    """
    if coeffs is None:
        return None
    
    return np.polyval(coeffs, x_range)

def check_trajectory_intersection(coeffs: np.ndarray, hoop_pos: Tuple[int, int], tolerance: int = 30) -> bool:
    """
    检查预测轨迹是否穿过篮筐
    """
    if coeffs is None:
        return False
    
    # 计算篮筐 x 坐标对应的 y 值
    predicted_y = np.polyval(coeffs, hoop_pos[0])
    
    # 检查预测的 y 是否接近篮筐的 y
    return abs(predicted_y - hoop_pos[1]) < tolerance

# def score(ball_positions: List, hoop_pos: Tuple[int, int]) -> bool:
#     """
#     综合判断是否进球
#     结合多种检测方法
#     """
#     if len(ball_positions) < 10:
#         return False
    
#     # 方法 1: 检查上下运动
#     has_up = any(detect_up([pos], hoop_pos) for pos in ball_positions[-10:])
#     has_down = any(detect_down([pos], hoop_pos) for pos in ball_positions[-10:])
    
#     # 方法 2: 检查轨迹
#     recent_positions = [pos[0] for pos in ball_positions[-15:]]
#     coeffs = fit_parabola(recent_positions)
#     trajectory_match = check_trajectory_intersection(coeffs, hoop_pos)
    
#     # 方法 3: 检查是否经过篮筐区域
#     passed_hoop = any(in_hoop_region(pos[0], hoop_pos, 40) for pos in ball_positions[-10:])
    
#     # 综合判断
#     return (has_up and has_down and passed_hoop) or trajectory_match

def score(ball_pos, hoop_pos):
    x = []
    y = []
    rim_height = hoop_pos[-1][0][1] - 0.5 * hoop_pos[-1][3]

    # Get first point above rim and first point below rim
    for i in reversed(range(len(ball_pos))):
        if ball_pos[i][0][1] < rim_height:
            x.append(ball_pos[i][0][0])
            y.append(ball_pos[i][0][1])
            if i + 1 < len(ball_pos):
                x.append(ball_pos[i + 1][0][0])
                y.append(ball_pos[i + 1][0][1])
            break

    # Create line from two points
    if len(x) > 1:
        m, b = np.polyfit(x, y, 1)
        predicted_x = ((hoop_pos[-1][0][1] - 0.5 * hoop_pos[-1][3]) - b) / m
        rim_x1 = hoop_pos[-1][0][0] - 0.4 * hoop_pos[-1][2]
        rim_x2 = hoop_pos[-1][0][0] + 0.4 * hoop_pos[-1][2]

        # Check if predicted path crosses the rim area (including rebound zone)
        if rim_x1 < predicted_x < rim_x2:
            return True
        # Check if ball enters rebound zone near the hoop
        hoop_rebound_zone = 10  # Define a buffer zone around the hoop
        if rim_x1 - hoop_rebound_zone < predicted_x < rim_x2 + hoop_rebound_zone:
            return True

    return False


def draw_trajectory(frame: np.ndarray, positions: List[Tuple[int, int]], color: Tuple[int, int, int] = (0, 255, 0)):
    """
    在帧上绘制球的轨迹
    """
    for i in range(1, len(positions)):
        cv2.line(frame, positions[i-1], positions[i], color, 2)
    
    # 绘制当前位置
    if positions:
        cv2.circle(frame, positions[-1], 5, color, -1)

def draw_detection_box(frame: np.ndarray, box: Tuple[int, int, int, int], label: str, confidence: float, color: Tuple[int, int, int] = (0, 255, 0)):
    """
    绘制检测框和标签
    """
    x1, y1, x2, y2 = map(int, box)
    
    # 绘制矩形框
    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
    
    # 绘制标签背景
    label_text = f"{label} {confidence:.2f}"
    (text_width, text_height), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
    cv2.rectangle(frame, (x1, y1 - text_height - 10), (x1 + text_width, y1), color, -1)
    
    # 绘制标签文本
    cv2.putText(frame, label_text, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

def add_score_overlay(frame: np.ndarray, makes: int, attempts: int, overlay_text: str = "", overlay_color: Tuple[int, int, int] = (0, 0, 0)):
    """
    在帧上添加得分叠加层
    """
    height, width = frame.shape[:2]
    
    # 半透明背景
    overlay = frame.copy()
    cv2.rectangle(overlay, (10, 10), (250, 120), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.3, frame, 0.7, 0, frame)
    
    # 显示统计信息
    cv2.putText(frame, f"Makes: {makes}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    cv2.putText(frame, f"Attempts: {attempts}", (20, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    
    if attempts > 0:
        accuracy = (makes / attempts) * 100
        cv2.putText(frame, f"Accuracy: {accuracy:.1f}%", (20, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    
    # 状态文本
    if overlay_text:
        text_size = cv2.getTextSize(overlay_text, cv2.FONT_HERSHEY_SIMPLEX, 1.5, 3)[0]
        text_x = (width - text_size[0]) // 2
        text_y = height - 50
        cv2.putText(frame, overlay_text, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, 1.5, overlay_color, 3)

def get_video_info(video_path: str) -> Dict:
    """
    获取视频的基本信息
    """
    cap = cv2.VideoCapture(video_path)
    
    info = {
        'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        'fps': cap.get(cv2.CAP_PROP_FPS),
        'frame_count': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
        'duration': int(cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS)),
        'codec': int(cap.get(cv2.CAP_PROP_FOURCC))
    }
    
    cap.release()
    return info

def save_detection_results(results: List[Dict], output_path: str):
    """
    保存检测结果为 JSON 文件
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

def load_detection_results(input_path: str) -> List[Dict]:
    """
    从 JSON 文件加载检测结果
    """
    with open(input_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def format_time(seconds: float) -> str:
    """
    将秒数格式化为 HH:MM:SS 或 MM:SS
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    if hours > 0:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    else:
        return f"{minutes}:{secs:02d}"

def create_thumbnail(video_path: str, output_path: str, timestamp: float = 0):
    """
    从视频中提取缩略图
    """
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    # 跳转到指定时间
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(timestamp * fps))
    
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(output_path, frame)
    
    cap.release()

def compress_video(input_path: str, output_path: str, crf: int = 28):
    """
    压缩视频文件
    crf: 质量参数，18-28 之间，值越大压缩率越高
    """
    import subprocess
    
    cmd = [
        'ffmpeg',
        '-i', input_path,
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', str(crf),
        '-c:a', 'aac',
        '-b:a', '128k',
        '-y',
        output_path
    ]
    
    subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

def validate_video_file(file_path: str) -> bool:
    """
    验证视频文件是否有效
    """
    if not os.path.exists(file_path):
        return False
    
    try:
        cap = cv2.VideoCapture(file_path)
        ret = cap.isOpened()
        cap.release()
        return ret
    except:
        return False

def calculate_shot_angle(ball_positions: List[Tuple[int, int]]) -> float:
    """
    计算投篮角度（基于轨迹的起点）
    """
    if len(ball_positions) < 5:
        return 0
    
    # 取前几个位置计算初始角度
    start_pos = ball_positions[0]
    mid_pos = ball_positions[3]
    
    dx = mid_pos[0] - start_pos[0]
    dy = mid_pos[1] - start_pos[1]
    
    # 计算角度（度数）
    angle = np.degrees(np.arctan2(dy, dx))
    return angle

def estimate_ball_velocity(ball_positions: List[Tuple[Tuple[int, int], int]], fps: float) -> float:
    """
    估计球的速度（像素/秒）
    """
    if len(ball_positions) < 2:
        return 0
    
    # 计算连续帧之间的距离
    distances = []
    for i in range(1, len(ball_positions)):
        dist = calculate_distance(ball_positions[i][0], ball_positions[i-1][0])
        frame_diff = ball_positions[i][1] - ball_positions[i-1][1]
        if frame_diff > 0:
            distances.append(dist / frame_diff)
    
    if not distances:
        return 0
    
    # 平均速度（像素/帧）转换为（像素/秒）
    avg_velocity_per_frame = np.mean(distances)
    return avg_velocity_per_frame * fps

# 导出所有函数
__all__ = [
    'get_device',
    'calculate_distance',
    'clean_ball_pos',
    'clean_hoop_pos',
    'detect_up',
    'detect_down',
    'in_hoop_region',
    'score',
    'fit_parabola',
    'predict_trajectory',
    'check_trajectory_intersection',
    'draw_trajectory',
    'draw_detection_box',
    'add_score_overlay',
    'get_video_info',
    'save_detection_results',
    'load_detection_results',
    'format_time',
    'create_thumbnail',
    'compress_video',
    'validate_video_file',
    'calculate_shot_angle',
    'estimate_ball_velocity'
]