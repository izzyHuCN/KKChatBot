import socket

def get_local_ip():
    """获取本地IP地址"""
    try:
        # 创建一个UDP socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # 连接到一个外网地址（这里用Google的DNS）
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def get_all_ips():
    """获取所有网络接口的IP"""
    import subprocess
    result = subprocess.run(['ipconfig'] if socket.gethostname().endswith('.local') else ['ifconfig'],
                          capture_output=True, text=True)
    return result.stdout

if __name__ == "__main__":
    print("=== 你的网络信息 ===")
    print(f"主机名: {socket.gethostname()}")
    print(f"本地IP: {get_local_ip()}")
    print(f"回环地址: 127.0.0.1")
    print("\n局域网内其他人可以访问:")
    print(f"  http://{get_local_ip()}:3000")
    print("\n完整网络信息:")
    print(get_all_ips()[:500])  # 只显示前500字符