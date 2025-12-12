# 🏀 Tiktok_Player

<div align="center">

![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python)
![YOLOv8](https://img.shields.io/badge/YOLOv8-AI%20Detection-green?style=for-the-badge)
![Flask](https://img.shields.io/badge/Flask-Backend-red?style=for-the-badge&logo=flask)

**🎯 基于AI的篮球视频智能分析后端系统**

使用YOLOv8深度学习模型实现篮球进球自动检测和视频集锦生成的后端API服务。

</div>

## 🎬 演示视频
<video src="./assets/result-demo.mp4" controls width="720">
你的浏览器不支持 video 标签。可点击链接直接下载查看。
</video>

https://github.com/user-attachments/assets/1f67280e-6ca2-4887-b5c1-60be24da60c1




## ✨ 核心功能

- 🎯 **AI进球检测**：基于YOLOv8模型的篮球进球自动识别
- 🎬 **视频集锦生成**：FFmpeg自动剪辑生成精彩进球集锦
- 📊 **统计分析**：提供投篮统计和命中率分析
- 🚀 **REST API**：完整的后端API接口服务
- ⚡ **实时处理**：支持视频上传和实时处理进度反馈

## 🛠️ 技术栈

- **Flask** - Python Web框架
- **YOLOv8** (Ultralytics) - AI目标检测模型
- **OpenCV** - 计算机视觉库
- **FFmpeg** - 视频处理工具

## 📋 系统要求

- **Python 3.8+**
- **FFmpeg** (用于视频处理)
- **支持的视频格式**：MP4, AVI, MOV, MKV

## 🚀 快速开始

```bash
# 克隆项目
git clone <repository-url>
cd Tiktok_Player

# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境 (Windows)
venv\Scripts\activate
# 或 (Linux/macOS)
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动后端服务(测试阶段)
python test_full_pipeline.py
```

## 注意事项
**目前仍处于测试阶段，测试视频存放于backend\test_files目录下。**  
**如你想生成自己的集锦视频，可以将视频保存在该目录下。**
**进入backend\test_full_pipeline.py文件，修改video_path变量为你保存的视频文件名。**
**运行test_full_pipeline.py文件，即可生成集锦视频。**


## 📁 项目结构

```
Tiktok_Player/
├── backend/                 # 后端代码
│   ├── app.py              # 主应用文件
│   ├── shot_detector_video.py  # 进球检测模块
│   ├── video_processor.py   # 视频处理模块
│   ├── utils.py            # 工具函数
│   ├── requirements.txt    # 依赖配置
│   ├── uploads/            # 上传文件目录
│   ├── outputs/            # 输出文件目录
│   └── AI-Basketball-Shot-Detection-Tracker/  # AI模型
├── models/                 # 模型文件目录
├── outputs/                # 全局输出目录
├── uploads/                # 全局上传目录
└── README.md              # 项目说明文档
```

## 📡 API接口

### 上传视频并处理
```bash
POST /api/upload
Content-Type: multipart/form-data

# 参数
- file: 视频文件 (MP4, AVI, MOV, MKV)
- before_time: 进球前保留时间 (默认8秒)
- after_time: 进球后保留时间 (默认2秒)
```

### 获取处理状态
```bash
GET /api/status/{task_id}
```

### 下载集锦视频
```bash
GET /api/download/{filename}
```

## 📄 许可证

MIT License


## 🙏 致谢
- 本项目受 [AI-Basketball-Shot-Detection-Tracker](https://github.com/avishah3/AI-Basketball-Shot-Detection-Tracker) 的启发，感谢作者提供的思路与开源贡献。







**🏀 帮你发现篮球场上的每一个精彩瞬间！**
