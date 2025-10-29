# Windows 系统启动指南

## 快速启动

在 Windows 系统上，请使用以下方式启动系统：

### 方式一：使用批处理文件（推荐）
```cmd
# 在项目根目录下运行
start.bat
```

### 方式二：手动启动
```powershell
# 1. 启动后端服务
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py

# 2. 启动前端服务（新开一个终端）
cd frontend
npm install
npm run dev
```

## 重要说明

### Windows 系统兼容性
- **不要使用** `chmod +x start.sh` 命令，这是 Linux/Mac 命令
- Windows 系统请直接运行 `start.bat` 文件
- 如果需要给文件添加执行权限，请右键文件 → 属性 → 安全 → 编辑权限

### 系统要求
- Windows 10/11
- Python 3.8+
- Node.js 16+
- 至少 4GB 可用内存
- 支持 CUDA 的显卡（可选，用于加速 AI 推理）

### 常见问题

#### 1. PowerShell 执行策略限制
如果遇到执行策略错误，请以管理员身份运行 PowerShell 并执行：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2. Python 虚拟环境问题
如果虚拟环境创建失败：
```cmd
cd backend
python -m pip install --upgrade pip
python -m venv venv --clear
```

#### 3. 端口占用问题
- 后端默认端口：5000
- 前端默认端口：5173

如果端口被占用，可以修改配置文件或结束占用进程。

## 访问地址

启动成功后，请访问：
- 前端界面：http://localhost:5173
- 后端API：http://localhost:5000

## 功能说明

1. **视频上传**：支持 MP4 格式的篮球视频
2. **智能检测**：自动识别进球时刻
3. **精彩剪辑**：生成包含所有进球的集锦视频
4. **实时进度**：显示处理进度和状态

## 技术支持

如遇问题，请检查：
1. 所有依赖是否正确安装
2. 端口是否被占用
3. 防火墙是否阻止了服务
4. Python 和 Node.js 版本是否符合要求