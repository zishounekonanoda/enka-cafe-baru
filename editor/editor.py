import json
import os
import sys
import tkinter as tk
from tkinter import ttk, messagebox

def get_base_path():
    """ 実行可能ファイル(exe)かスクリプト(.py)かを判別し、基準パスを返す """
    if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
        # PyInstallerによって作成されたexeの場合
        return os.path.dirname(sys.executable)
    else:
        # 通常のスクリプトとして実行された場合
        return os.path.dirname(os.path.abspath(__file__))

class NewsEditorApp:
    def __init__(self, root):
        self.root = root
        self.root.title(" お知らせ編集ツール")
        self.root.geometry("800x600")

        self.file_path = os.path.join(get_base_path(), "news.json")
        self.news_data = []

        # --- スタイル設定 ---
        style = ttk.Style()
        style.configure("Treeview.Heading", font=('Yu Gothic UI', 10, 'bold'))
        style.configure("Treeview", rowheight=25, font=('Yu Gothic UI', 10))

        # --- メインフレーム ---
        main_frame = ttk.Frame(root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # --- 上部フレーム (ボタン) ---
        top_frame = ttk.Frame(main_frame)
        top_frame.pack(fill=tk.X, pady=5)

        self.add_button = ttk.Button(top_frame, text="新規追加", command=self.add_item)
        self.add_button.pack(side=tk.LEFT, padx=5)

        self.edit_button = ttk.Button(top_frame, text="編集", command=self.edit_item)
        self.edit_button.pack(side=tk.LEFT, padx=5)

        self.delete_button = ttk.Button(top_frame, text="削除", command=self.delete_item)
        self.delete_button.pack(side=tk.LEFT, padx=5)
        
        self.save_button = ttk.Button(top_frame, text="変更をファイルに保存", command=self.save_news)
        self.save_button.pack(side=tk.RIGHT, padx=5)

        # --- 中央フレーム (一覧) ---
        tree_frame = ttk.Frame(main_frame)
        tree_frame.pack(fill=tk.BOTH, expand=True, pady=5)

        columns = ("date", "category", "title")
        self.tree = ttk.Treeview(tree_frame, columns=columns, show="headings")
        
        self.tree.heading("date", text="日付")
        self.tree.heading("category", text="カテゴリ")
        self.tree.heading("title", text="タイトル")

        self.tree.column("date", width=120, anchor=tk.W)
        self.tree.column("category", width=100, anchor=tk.W)
        self.tree.column("title", width=400, anchor=tk.W)

        # スクロールバー
        scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=self.tree.yview)
        self.tree.configure(yscroll=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.load_news()

    def load_news(self):
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, 'r', encoding='utf-8') as f:
                    self.news_data = json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                messagebox.showerror("読込エラー", f"{self.file_path} の読み込みに失敗しました。\n{e}")
                self.news_data = []
        else:
            self.news_data = []
        self.populate_treeview()

    def save_news(self):
        try:
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump(self.news_data, f, indent=2, ensure_ascii=False)
            messagebox.showinfo("保存完了", f"{self.file_path} に変更を保存しました。")
        except IOError as e:
            messagebox.showerror("保存エラー", f"{self.file_path} への保存に失敗しました。\n{e}")

    def populate_treeview(self):
        for i in self.tree.get_children():
            self.tree.delete(i)
        for i, item in enumerate(self.news_data):
            self.tree.insert("", tk.END, iid=str(i), values=(item.get('date', ''), item.get('category', ''), item.get('title', '')))

    def add_item(self):
        self.open_edit_dialog()

    def edit_item(self):
        selected_items = self.tree.selection()
        if not selected_items:
            messagebox.showwarning("選択エラー", "一覧から編集したい項目を選択してください。")
            return
        item_index = int(selected_items[0])
        self.open_edit_dialog(item_index)

    def delete_item(self):
        selected_items = self.tree.selection()
        if not selected_items:
            messagebox.showwarning("選択エラー", "一覧から削除したい項目を選択してください。")
            return
        item_index = int(selected_items[0])
        item_title = self.news_data[item_index].get('title', '無題')
        if messagebox.askyesno("削除の確認", f"「{item_title}」を削除しますか？"):
            self.news_data.pop(item_index)
            self.populate_treeview()

    def open_edit_dialog(self, item_index=None):
        dialog = tk.Toplevel(self.root)
        dialog.title("お知らせの編集" if item_index is not None else "お知らせの新規追加")
        dialog.geometry("500x450")
        dialog.resizable(False, False)
        dialog.transient(self.root) # 親ウィンドウの上に表示
        dialog.grab_set() # モーダルにする

        is_new = item_index is None
        item = self.news_data[item_index] if not is_new else {}

        frame = ttk.Frame(dialog, padding="15")
        frame.pack(fill=tk.BOTH, expand=True)

        # --- フォーム要素 ---
        fields = ["日付 (例: 2025.09.30)", "カテゴリ", "タイトル", "画像ファイル名 (任意)"]
        entries = {}

        for i, label_text in enumerate(fields):
            label = ttk.Label(frame, text=label_text)
            label.grid(row=i, column=0, sticky=tk.W, padx=5, pady=5)
            entry = ttk.Entry(frame, width=50)
            entry.grid(row=i, column=1, sticky=tk.EW, padx=5, pady=5)
            entries[label_text] = entry

        # 本文
        content_label = ttk.Label(frame, text="本文")
        content_label.grid(row=len(fields), column=0, sticky=tk.W, padx=5, pady=5)
        content_text = tk.Text(frame, width=50, height=8, font=('Yu Gothic UI', 10))
        content_text.grid(row=len(fields), column=1, sticky=tk.EW, padx=5, pady=5)

        # フォームに既存データを設定
        entries["日付 (例: 2025.09.30)"].insert(0, item.get('date', ''))
        entries["カテゴリ"].insert(0, item.get('category', ''))
        entries["タイトル"].insert(0, item.get('title', ''))
        image_name = os.path.basename(item.get('image', '')) if item.get('image') else ''
        entries["画像ファイル名 (任意)"].insert(0, image_name)
        content_text.insert("1.0", item.get('content', ''))

        def on_save():
            new_item = {}
            new_item['date'] = entries["日付 (例: 2025.09.30)"].get()
            new_item['datetime'] = new_item['date'].replace('.', '-')
            new_item['category'] = entries["カテゴリ"].get()
            new_item['title'] = entries["タイトル"].get()
            new_item['content'] = content_text.get("1.0", tk.END).strip()
            
            image_filename = entries["画像ファイル名 (任意)"].get().strip()
            new_item['image'] = f"./images/{image_filename}" if image_filename else None
            new_item['alt'] = new_item['title']
            new_item['category_color'] = 'bg-amber-800' if new_item['category'] == '新メニュー' else 'bg-stone-500'

            if is_new:
                self.news_data.insert(0, new_item)
            else:
                self.news_data[item_index] = new_item
            
            self.populate_treeview()
            dialog.destroy()

        # 保存・キャンセルボタン
        button_frame = ttk.Frame(frame)
        button_frame.grid(row=len(fields) + 1, column=1, sticky=tk.E, pady=10)
        save_btn = ttk.Button(button_frame, text="保存", command=on_save)
        save_btn.pack(side=tk.LEFT, padx=5)
        cancel_btn = ttk.Button(button_frame, text="キャンセル", command=dialog.destroy)
        cancel_btn.pack(side=tk.LEFT)

if __name__ == "__main__":
    root = tk.Tk()
    app = NewsEditorApp(root)
    root.mainloop()