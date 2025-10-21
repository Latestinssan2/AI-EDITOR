
const stickerData: Record<string, string[]> = {
    'Memes': [
        'https://em-content.zobj.net/source/twitter/376/face-with-tears-of-joy_1f602.png',
        'https://em-content.zobj.net/source/twitter/376/rolling-on-the-floor-laughing_1f923.png',
        'https://em-content.zobj.net/source/twitter/376/ok-hand_1f44c.png',
        'https://em-content.zobj.net/source/twitter/376/clown-face_1f921.png',
        'https://em-content.zobj.net/source/twitter/376/skull_1f480.png',
    ],
    'Skulls & Bones': [
        'https://em-content.zobj.net/source/twitter/376/skull_1f480.png',
        'https://em-content.zobj.net/source/twitter/376/skull-and-crossbones_2620-fe0f.png',
    ],
    'Shapes': [
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Circle_-_black_simple.svg/1024px-Circle_-_black_simple.svg.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Square_-_black_simple.svg/1024px-Square_-_black_simple.svg.png',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Star_-_black_simple.svg/1024px-Star_-_black_simple.svg.png',
    ],
    'Emojis': [
        'https://em-content.zobj.net/source/twitter/376/smiling-face-with-heart-eyes_1f60d.png',
        'https://em-content.zobj.net/source/twitter/376/fire_1f525.png',
        'https://em-content.zobj.net/source/twitter/376/hundred-points_1f4af.png',
    ]
};

class StickerService {
    getCategories(): string[] {
        return Object.keys(stickerData);
    }

    getStickers(category: string): string[] {
        return stickerData[category] || [];
    }
}

export const stickerService = new StickerService();
