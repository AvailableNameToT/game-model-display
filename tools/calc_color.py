def hex_to_rgb(hex_color):
    # 去掉 # 符号
    hex_color = hex_color.lstrip('#')
    # 检查长度是否为 6
    if len(hex_color) != 6:
        raise ValueError("Invalid hex color code")
    # 将每两个字符转换为十进制整数
    r = float(f"{int(hex_color[0:2], 16) / 255.0:.3f}")
    g = float(f"{int(hex_color[2:4], 16) / 255.0:.3f}")
    b = float(f"{int(hex_color[4:6], 16) / 255.0:.3f}")
    return r, g, b


if __name__ == '__main__':
    print(hex_to_rgb('#f8f9fa'))
