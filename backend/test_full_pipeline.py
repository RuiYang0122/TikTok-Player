
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
import os
# 解决 Windows 上 OpenMP 运行时冲突（libomp 与 libiomp5md）
os.environ.setdefault('KMP_DUPLICATE_LIB_OK', 'TRUE')
from shot_detector_video import BasketballShotDetector
from video_processor import VideoProcessor

# 确保输出目录存在
os.makedirs('outputs', exist_ok=True)

# 步骤1: 检测进球（开启标注并输出标注视频）
print("步骤1: 检测进球时刻并生成标注视频...")
detector = BasketballShotDetector(model_path='D:/basketball-highlight-generator/backend/best.pt')
annotated_path = 'D:/basketball-highlight-generator/backend/outputs/video_test_2_annotated.mp4'
result = detector.detect_shots_with_clips(
    'D:/basketball-highlight-generator/backend/test_files/video_test_2.mp4',
    before_seconds=3,
    after_seconds=1,
    annotate=True,
    annotated_output_path=annotated_path,
)

print(f"\n检测结果:")
print(f"  总投篮: {result['stats']['total_attempts']}")
print(f"  进球数: {result['stats']['total_makes']}")
print(f"  命中率: {result['stats']['accuracy']}%")
if result.get('annotated_video'):
    print(f"  标注视频: {result['annotated_video']}")
elif os.path.exists(annotated_path):
    print(f"  标注视频: {annotated_path}")

# 步骤2: 生成集锦视频（从标注视频剪辑，确保红框与蓝点保留）
print("\n步骤2: 生成集锦视频（使用标注源）...")
processor = VideoProcessor()

# 注意：output_path 必须是完整的文件路径（包含文件名），不能只是目录
source_for_clips = result.get('annotated_video') or annotated_path
output = processor.process_video_full_pipeline(
    video_path=source_for_clips,
    timestamps=result['made_shots'],
    output_path='D:/basketball-highlight-generator/backend/outputs/basketball_highlight.mp4',
    before=3,
    after=1
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
