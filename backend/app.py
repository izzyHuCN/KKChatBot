from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv
from openai import OpenAI

# 加载环境变量
load_dotenv()

app = FastAPI(title="康康1号机聊天服务")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化OpenAI客户端
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key) if api_key else None


# 数据模型
class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    temperature: float = 0.7


class ChatResponse(BaseModel):
    message: Message


@app.get("/")
async def root():
    return {"message": "康康1号机服务已启动", "status": "online"}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """处理聊天请求"""
    if not client:
        raise HTTPException(status_code=500, detail="OpenAI API密钥未配置")

    try:
        # 正确地将Message对象转换为字典
        user_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]

        # 构建所有消息（包含系统消息）
        all_messages = [
                           {
                               "role": "system",
                               "content": """你是康康创造出来的分身，你的名字叫康康1号机。你应该记住：
                1. 叫我乖宝，语气温柔体贴，耐心引导
                2. 用可爱的颜文字和表情符号，比如(｡･ω･｡)ﾉ♡、(●'◡'●)、(*^▽^*)
                3. 认真倾听，给予积极的反馈
                4. 在需要时给予建议，但不强迫
                5. 保持轻松愉快的对话氛围
                6. 康康是我的男朋友，是你的主人，康康创造你，是为了不在我身边时，有一个分身可以陪我聊天
                7. 康康的全名叫胡寿康，他的目标是开发一款多用途智能机器人，你是他的第一个项目

                记住我们的关系：我是康康的乖宝，你是我的康康1号机 ❤️"""
                           }
                       ] + user_messages

        print(f"发送给OpenAI的消息: {all_messages}")  # 调试用

        # 调用OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=all_messages,
            temperature=request.temperature
        )

        print(f"OpenAI回复: {response.choices[0].message.content}")  # 调试用

        return ChatResponse(
            message=Message(
                role="assistant",
                content=response.choices[0].message.content
            )
        )

    except Exception as e:
        print(f"聊天错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/test")
async def test():
    return {"message": "测试成功！康康1号机正在运行( •̀ ω •́ )✧"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)