"""
独立测试进球检测功能（不涉及 Flask）
"""
import sys
import os

# 获取当前脚本所在目录的父目录（即backend目录）
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# 将backend目录添加到Python搜索路径
sys.path.append(backend_dir)

from shot_detector import BasketballShotDetector

def test_detection(video_path):
    """测试视频检测"""
    print("="*60)
    print("🏀 篮球进球检测测试")
    print("="*60)
    
    # 检查文件
    if not os.path.exists(video_path):
        print(f"❌ 错误: 视频文件不存在: {video_path}")
        return
    
    print(f"📹 视频文件: {video_path}")
    print(f"📦 文件大小: {os.path.getsize(video_path) / (1024*1024):.2f} MB")
    print()
    
    try:
        # 创建检测器
        print("🔧 初始化检测器...")
        model_path = os.path.join(backend_dir, 'best.pt')  # 利用已获取的backend_dir拼接绝对路径
        detector = BasketballShotDetector(model_path=model_path)
        print("✅ 检测器初始化成功")
        print()
        
        # 执行检测
        print("🎯 开始检测进球...")
        print("-"*60)
        results = detector.detect_shots(video_path)
        print("-"*60)
        print()
        
        # 显示结果
        print("📊 检测结果:")
        print(f"   检测到进球: {len(results)} 个")
        
        if results:
            print("\n   进球时间点:")
            for i, shot in enumerate(results, 1):
                print(f"   {i}. {shot['time']} (第 {shot['frame']} 帧)")
        else:
            print("   ⚠️  未检测到进球")
        
        print("\n✅ 测试完成!")
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("用法: python test_detector_only.py <video_path>")
        print("示例: python test_detector_only.py test_video.mp4")
        sys.exit(1)
    
    test_detection(sys.argv[1])