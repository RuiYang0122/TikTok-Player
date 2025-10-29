
# from video_processor import VideoProcessor

# # 步骤1: 检测进球
# print("步骤1: 检测进球时刻...")
# detector = BasketballShotDetector(model_path='tt')
# result = detector.detect_shots_with_clips('D:/basketball-highlight-generator/backend/test_files/video_test_1.mp4')

# print(f"\n检测结果:")
# print(f"  总投篮: {result['stats']['total_attempts']}")
# print(f"  进球数: {result['stats']['total_makes']}")
# print(f"  命中率: {result['stats']['accuracy']}%")

# # 步骤2: 生成集锦视频
# print("\n步骤2: 生成集锦视频...")
# processor = VideoProcessor()
# output = processor.process_video_full_pipeline(
#     video_path='你的测试视频.mp4',
#     timestamps=result['made_shots'],
#     output_path='basketball_highlight.mp4',
#     before=8,
#     after=2
# )

# if output['success']:
#     print(f"\n🎉 集锦生成成功!")
#     print(f"📁 输出文件: {output['output_file']}")
# else:
#     print(f"\n❌ 失败: {output['error']}")

from shot_detector_video import BasketballShotDetector
from video_processor import VideoProcessor
import os

# 确保输出目录存在
os.makedirs('outputs', exist_ok=True)

# 步骤1: 检测进球
print("步骤1: 检测进球时刻...")
detector = BasketballShotDetector(model_path='D:/basketball-highlight-generator/backend/best.pt')
result = detector.detect_shots_with_clips('D:/basketball-highlight-generator/backend/test_files/video_test_2.mp4')

print(f"\n检测结果:")
print(f"  总投篮: {result['stats']['total_attempts']}")
print(f"  进球数: {result['stats']['total_makes']}")
print(f"  命中率: {result['stats']['accuracy']}%")

# 步骤2: 生成集锦视频
print("\n步骤2: 生成集锦视频...")
processor = VideoProcessor()

# 注意：output_path 必须是完整的文件路径（包含文件名），不能只是目录
output = processor.process_video_full_pipeline(
    video_path='D:/basketball-highlight-generator/backend/test_files/video_test_2.mp4',
    timestamps=result['made_shots'],
    output_path='D:/basketball-highlight-generator/backend/outputs/basketball_highlight.mp4',  # ← 修复：添加文件名
    before=3,  # 进球前5秒
    after=1    # 进球后1秒
)

if output['success']:
    print(f"\n🎉 集锦生成成功!")
    print(f"📁 输出文件: {output['output_file']}")
    
    # 显示文件大小
    if os.path.exists(output['output_file']):
        size_mb = os.path.getsize(output['output_file']) / (1024 * 1024)
        print(f"📦 文件大小: {size_mb:.2f} MB")
else:
    print(f"\n❌ 失败: {output['error']}")