import cv2
import os
import numpy as np

def combine_videos():
    video_dir = os.path.join(os.getcwd(), 'assets', 'videos')
    v1_path = os.path.join(video_dir, 'ClassicWedding.mp4')
    v2_path = os.path.join(video_dir, 'FamilyPhoto.mp4')
    v3_path = os.path.join(video_dir, 'OldMemories.mp4')
    v4_path = os.path.join(video_dir, 'VintagePortrait.mp4')
    out_path = os.path.join(video_dir, 'TransformationGridMaster.mp4')

    cap1 = cv2.VideoCapture(v1_path)
    cap2 = cv2.VideoCapture(v2_path)
    cap3 = cv2.VideoCapture(v3_path)
    cap4 = cv2.VideoCapture(v4_path)

    fps = cap1.get(cv2.CAP_PROP_FPS) or 24.0
    
    # Intrinsic 3:4 aspect ratio for cards (1080x1440 => 480x640)
    card_w = 480
    card_h = 640
    gap = 24  # gap between grid cards

    grid_w = card_w * 2 + gap
    grid_h = card_h * 2 + gap

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(out_path, fourcc, fps, (grid_w, grid_h))

    while True:
        ret1, frame1 = cap1.read()
        ret2, frame2 = cap2.read()
        ret3, frame3 = cap3.read()
        ret4, frame4 = cap4.read()

        if not (ret1 and ret2 and ret3 and ret4):
            break

        f1 = cv2.resize(frame1, (card_w, card_h))
        f2 = cv2.resize(frame2, (card_w, card_h))
        f3 = cv2.resize(frame3, (card_w, card_h))
        f4 = cv2.resize(frame4, (card_w, card_h))

        # Canvas with clean white background matching app theme (#FFFFFF)
        canvas = np.full((grid_h, grid_w, 3), 255, dtype=np.uint8)

        # Top-Left (Classic Wedding)
        canvas[0:card_h, 0:card_w] = f1
        # Top-Right (Family Photo)
        canvas[0:card_h, card_w + gap:grid_w] = f2
        # Bottom-Left (Old Memories)
        canvas[card_h + gap:grid_h, 0:card_w] = f3
        # Bottom-Right (Vintage Portrait)
        canvas[card_h + gap:grid_h, card_w + gap:grid_w] = f4

        out.write(canvas)

    cap1.release()
    cap2.release()
    cap3.release()
    cap4.release()
    out.release()
    print(f"Successfully generated master 2x2 grid video with 3:4 aspect ratio: {out_path}")

if __name__ == '__main__':
    combine_videos()
