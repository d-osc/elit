import os
import requests
import json

# ดึงค่าจาก Environment Variables
ZHIPU_API_KEY = os.environ.get("ZHIPU_API_KEY")
GH_PAT = os.environ.get("GH_PAT")
PR_NUMBER = os.environ.get("PR_NUMBER")
REPO = os.environ.get("REPO") # format: owner/repo

# 1. ดึงไฟล์ที่ถูกเปลี่ยนแปลง (Diff) จาก GitHub API
def get_pr_diff():
    url = f"https://api.github.com/repos/{REPO}/pulls/{PR_NUMBER}/files"
    headers = {
        "Authorization": f"token {GH_PAT}",
        "Accept": "application/vnd.github.v3+json"
    }
    response = requests.get(url, headers=headers)
    files = response.json()
    
    # รวบรวมชื่อไฟล์และ patch (ส่วนที่แก้ไข) แต่ถ้าไฟล์ใหญ่มากอาจต้องตัดบรรทัด
    diff_content = ""
    for file in files:
        if file.get('patch'):
            diff_content += f"File: {file['filename']}\n{file['patch']}\n\n"
    return diff_content

# 2. ส่งข้อมูลไปถาม GLM (Zhipu AI)
def ask_glm(diff_text):
    url = "https://api.z.ai/api/coding/paas/v4/chat/completions"
    headers = {
        "Authorization": f"Bearer {ZHIPU_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "glm-4.7", # หรือจะใช้ glm-4-flash ถ้าต้องการราคาถูกกว่า/เร็วกว่า
        "messages": [
            {
                "role": "user", 
                "content": f"คุณเป็น Code Reviewer ที่เก่งที่สุด กรุณาตรวจสอบโค้ดด้านล่างนี้ (Diff) และแนะนำการปรับปรุง พร้อมทั้งชี้ช่องโหว่ความปลอดภัยหากมี ตอบเป็นภาษาไทย:\n\n{diff_text}"
            }
        ]
    }
    
    response = requests.post(url, headers=headers, json=payload)
    return response.json()['choices'][0]['message']['content']

# 3. โพสต์คำตอบกลับลงใน GitHub PR
def post_comment_to_pr(message):
    url = f"https://api.github.com/repos/{REPO}/issues/{PR_NUMBER}/comments"
    headers = {
        "Authorization": f"token {GH_PAT}",
        "Accept": "application/vnd.github.v3+json"
    }
    data = {
        "body": f"## 🤖 GLM Code Review Bot\n\n{message}"
    }
    requests.post(url, headers=headers, json=data)

# --- Main Execution ---
if __name__ == "__main__":
    print("Fetching PR diff...")
    diff = get_pr_diff()
    
    if not diff:
        print("No diff found or diff is too large.")
    else:
        print("Sending to GLM...")
        review_result = ask_glm(diff)
        
        print("Posting comment to GitHub...")
        post_comment_to_pr(review_result)
        print("Done!")