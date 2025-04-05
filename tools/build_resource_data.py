import os
import json


# 考虑到使用这个项目的人不一定懂python，尽量不引入其他依赖，这里使用原生方案
def get_image_size(file_path):
    with open(file_path, 'rb') as f:
        header = f.read(24)  # 读取文件头的前24字节
        if len(header) < 24:
            return None

        # 检查文件类型
        if header.startswith(b'\x89PNG\r\n\x1a\n'):
            # PNG 文件
            width = int.from_bytes(header[16:20], byteorder='big')
            height = int.from_bytes(header[20:24], byteorder='big')
            return width, height
        # 未验证的代码
        # elif header.startswith(b'\xff\xd8'):
        #     # JPEG 文件
        #     # 读取到 SOF0 (Start of Frame) 标记
        #     while True:
        #         marker = header.find(b'\xff\xc0', 2)
        #         if marker == -1:
        #             break
        #         if marker + 5 < len(header):
        #             height = int.from_bytes(header[marker+5:marker+7], byteorder='big')
        #             width = int.from_bytes(header[marker+7:marker+9], byteorder='big')
        #             return width, height
        #         # 继续读取更多数据
        #         f.seek(marker + 2)
        #         header = header[:marker] + f.read(1024)
        # elif header.startswith(b'GIF87a') or header.startswith(b'GIF89a'):
        #     # GIF 文件
        #     width = int.from_bytes(header[6:8], byteorder='little')
        #     height = int.from_bytes(header[8:10], byteorder='little')
        #     return width, height
        # elif header.startswith(b'BM'):
        #     # BMP 文件
        #     width = int.from_bytes(header[18:22], byteorder='little')
        #     height = int.from_bytes(header[22:26], byteorder='little')
        #     return width, height
    return None


def load_game_resource(resource_path):
    with open(os.path.join(resource_path, 'setting.json'), 'r', encoding='utf-8') as file:
        game_info = json.load(file)
    characters = []
    image_size = None
    avatars_dir = os.path.join(resource_path, 'avatars')
    for name in os.listdir(avatars_dir):
        characters.append(os.path.splitext(name)[0])
        if image_size is None:
            image_size = get_image_size(os.path.join(avatars_dir, name))
    game_info['characters'] = characters
    game_info['avatar'] = {'width': image_size[0]}
    return game_info


def generate_resource_data():
    resource_dir = '../resource'
    resource_data = {}
    for game in os.listdir(resource_dir):
        resource_data[game] = load_game_resource(os.path.join(resource_dir, game))

    file_content = 'const resourceData = ' + json.dumps(resource_data, indent=4)

    data_js_path = '../data.js'
    with open(data_js_path, 'w', encoding='utf-8') as f:
        f.write(file_content)


if __name__ == '__main__':
    generate_resource_data()
