# 🏀 HoopCut

<div align="center">

![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python)
![YOLOv8](https://img.shields.io/badge/YOLOv8-AI%20Detection-green?style=for-the-badge)
![Flask](https://img.shields.io/badge/Flask-Backend-red?style=for-the-badge&logo=flask)

**🎯 基于AI的篮球视频自动剪辑系统**

使用YOLOv8深度学习模型实现篮球进球自动检测和视频集锦生成的后端API服务。

</div>

## 🎬 演示视频
<video src="./assets/result-demo.mp4" controls width="720">
你的浏览器不支持 video 标签。可点击链接直接下载查看。
</video>


https://github.com/user-attachments/assets/8723aabc-38b1-4c8e-90a3-13d688a820bf

## 🧩整体pipeline

<img width="1589" height="867" alt="屏幕截图 2025-12-16 231438" src="https://github.com/user-attachments/assets/6b113e21-f470-477b-b85f-d6520e7dd992" />


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
cd HoopCut

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

# 返回项目根目录
cd ..

# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

```

## 前端页面展示

<img width="2557" height="1055" alt="image" src="https://github.com/user-attachments/assets/fd98d4f4-fee8-4d09-95f5-c65ac9587bf5" />

## 处理过程页面

<img width="2549" height="1247" alt="image" src="https://github.com/user-attachments/assets/617a48ed-3cf8-47d9-899f-c69b2920e541" />

## 进球判断逻辑

<img width="1551" height="805" alt="屏幕截图 2025-12-16 231541" src="https://github.com/user-attachments/assets/4c312c84-b87f-477f-afb8-52021b03ec8e" />

<img width="1587" height="778" alt="image" src="https://github.com/user-attachments/assets/982d31da-49cf-4e1f-bf6c-be8c6e9cce69" />



## 📁 项目结构

```
HoopCut/
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
