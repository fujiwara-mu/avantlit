import tkinter as tk
from tkinter import ttk, messagebox, font, simpledialog
import os
from bs4 import BeautifulSoup, NavigableString

class LinkDialog(simpledialog.Dialog):
    """Custom dialog to get URL for a link."""
    def body(self, master):
        self.title("URLの入力")
        self.geometry("450x120")
        ttk.Label(master, text="リンク先の完全なURLを入力してください:").grid(row=0, sticky='w', padx=5, pady=5)
        self.entry = ttk.Entry(master, width=60)
        self.entry.grid(row=1, padx=5, pady=5)
        self.entry.focus_set()
        return self.entry

    def apply(self):
        self.result = self.entry.get()

class HtmlEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("about.html 専用 本文エディタ (最終FIX版)")
        self.root.geometry("1000x800")

        self.zenei_dir = os.path.dirname(os.path.abspath(__file__))
        self.current_file = os.path.join(self.zenei_dir, "about.html")

        # --- UI Elements ---
        top_frame = ttk.Frame(root, padding="5")
        top_frame.pack(fill='x')
        ttk.Label(top_frame, text="編集対象:").pack(side='left', padx=(0, 5))
        ttk.Label(top_frame, text=os.path.basename(self.current_file) + " の本文", font=("Yu Gothic UI", 10, "bold")).pack(side='left', anchor='w')

        toolbar = ttk.Frame(root, padding="5")
        toolbar.pack(fill='x')
        
        bottom_frame = ttk.Frame(root, padding="5")
        bottom_frame.pack(fill='x', side='bottom')

        text_frame = ttk.Frame(root)
        text_frame.pack(expand=True, fill='both', padx=5, pady=5)
        
        self.text_area = tk.Text(text_frame, wrap='word', undo=True, font=("Yu Gothic UI", 12), relief='sunken', borderwidth=1, spacing1=5, spacing3=5, padx=10, pady=5)
        self.text_area.pack(side='left', expand=True, fill='both')

        scrollbar = ttk.Scrollbar(text_frame, command=self.text_area.yview)
        scrollbar.pack(side='right', fill='y')
        self.text_area.config(yscrollcommand=scrollbar.set)

        self.setup_toolbar(toolbar)
        self.save_button = ttk.Button(bottom_frame, text="本文を保存", command=self.save_file)
        self.save_button.pack(side='right')
        self.status_bar = ttk.Label(bottom_frame, text="準備完了", anchor='w')
        self.status_bar.pack(side='left', expand=True, fill='x')

        self.setup_text_tags()
        self.load_file()

    def setup_toolbar(self, toolbar):
        ttk.Button(toolbar, text="↩️ 戻る", command=self.text_area.edit_undo).pack(side='left', padx=2)
        ttk.Button(toolbar, text="↪️ 進む", command=self.text_area.edit_redo).pack(side='left', padx=2)
        ttk.Separator(toolbar, orient='vertical').pack(side='left', fill='y', padx=5, pady=5)
        
        ttk.Button(toolbar, text="B", command=lambda: self.toggle_tag("bold")).pack(side='left', padx=2)
        ttk.Button(toolbar, text="I", command=lambda: self.toggle_tag("italic")).pack(side='left', padx=2)
        ttk.Button(toolbar, text="🔗 リンク", command=self.apply_link).pack(side='left', padx=2)

    def setup_text_tags(self):
        default_font = font.Font(font=self.text_area['font'])
        
        bold_font = font.Font(font=default_font)
        bold_font.configure(weight='bold')
        self.text_area.tag_configure("bold", font=bold_font)

        italic_font = font.Font(font=default_font)
        italic_font.configure(slant='italic')
        self.text_area.tag_configure("italic", font=italic_font)
        
        bold_italic_font = font.Font(font=default_font)
        bold_italic_font.configure(weight='bold', slant='italic')
        self.text_area.tag_configure("bold_italic", font=bold_italic_font)

        self.text_area.tag_configure("link", foreground="#0000EE", underline=True)

    def load_file(self):
        self.text_area.config(state='normal')
        self.text_area.delete('1.0', tk.END)
        try:
            with open(self.current_file, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f, 'html.parser')
            
            editable_div = soup.find('div', id='editable-content')
            if not editable_div:
                raise ValueError("<div id='editable-content'> が見つかりません。")

            for i, p_tag in enumerate(editable_div.find_all('p')):
                if i > 0: self.text_area.insert(tk.END, '\n')
                if not p_tag.contents or (len(p_tag.contents) == 1 and str(p_tag.contents[0]) == '&nbsp;'):
                    continue
                self.parse_and_insert_content(p_tag)

            self.update_status(f"読み込み完了: {os.path.basename(self.current_file)} の本文")
            self.text_area.edit_reset()
        except Exception as e:
            self.update_status(f"エラー: ファイル読み込み失敗 - {e}")
            messagebox.showerror("読み込みエラー", f"ファイルの読み込み中にエラーが発生しました:\n{e}")
            self.text_area.config(state='disabled')

    def parse_and_insert_content(self, element):
        for child in element.children:
            if isinstance(child, NavigableString):
                self.text_area.insert(tk.END, str(child))
                continue
            
            start_index = self.text_area.index(tk.END)
            self.parse_and_insert_content(child)
            end_index = self.text_area.index(tk.END)

            if start_index != end_index:
                tag_name = child.name
                parent_names = {p.name for p in child.find_parents()}
                
                is_bold = tag_name in ['strong', 'b'] or 'strong' in parent_names or 'b' in parent_names
                is_italic = tag_name in ['em', 'i'] or 'em' in parent_names or 'i' in parent_names

                if is_bold and is_italic: self.text_area.tag_add("bold_italic", start_index, end_index)
                elif is_bold: self.text_area.tag_add("bold", start_index, end_index)
                elif is_italic: self.text_area.tag_add("italic", start_index, end_index)

                if tag_name == 'a' and child.has_attr('href'):
                    href = child['href']
                    link_tag_name = f"link_{href}"
                    self.text_area.tag_configure(link_tag_name)
                    self.text_area.tag_add(link_tag_name, start_index, end_index)
                    self.text_area.tag_add("link", start_index, end_index)

    def save_file(self):
        try:
            with open(self.current_file, 'r', encoding='utf-8') as f:
                soup = BeautifulSoup(f, 'html.parser')
            
            editable_div = soup.find('div', id='editable-content')
            if not editable_div:
                raise ValueError("<div id='editable-content'> が見つかりません。")

            editable_div.clear()
            
            lines = self.text_area.get("1.0", tk.END).strip().split('\n')

            for line in lines:
                if not line:
                    p_tag = soup.new_tag('p')
                    p_tag.append(BeautifulSoup('&nbsp;', 'html.parser').find(text=True))
                    editable_div.append(p_tag)
                    continue

                p_tag = soup.new_tag('p')
                line_start_index = self.text_area.search(line, "1.0", "end")
                if not line_start_index: continue
                line_end_index = f"{line_start_index}+{len(line)}c"
                
                events = self.text_area.dump(line_start_index, line_end_index, text=True, tag=True)
                
                parent_stack = [p_tag]
                
                for key, value, index in events:
                    if key == "text":
                        parent_stack[-1].append(NavigableString(value))
                    elif key == "tagon":
                        new_tag = None
                        if value == "bold" or value == "bold_italic": new_tag = soup.new_tag('strong')
                        elif value == "italic": new_tag = soup.new_tag('em')
                        elif value.startswith("link_"):
                            href = value[len("link_"):]
                            new_tag = soup.new_tag('a', href=href)
                        
                        if new_tag:
                            parent_stack[-1].append(new_tag)
                            parent_stack.append(new_tag)
                    elif key == "tagoff":
                        if len(parent_stack) > 1:
                            parent_stack.pop()
                
                editable_div.append(p_tag)

            with open(self.current_file, 'w', encoding='utf-8') as f:
                f.write(str(soup.prettify(formatter="html5")))

            self.update_status(f"保存完了: {os.path.basename(self.current_file)}")
            messagebox.showinfo("成功", "ファイルが正常に保存されました。")
            self.text_area.edit_reset()
            self.load_file()

        except Exception as e:
            self.update_status(f"エラー: ファイル保存失敗 - {e}")
            messagebox.showerror("保存エラー", f"ファイルの保存中にエラーが発生しました:\n{e}")

    def toggle_tag(self, tag_name):
        try:
            sel_start = self.text_area.index("sel.first")
            sel_end = self.text_area.index("sel.last")
            
            # This logic correctly handles overlapping bold/italic styles
            for i in range(self.text_area.count(sel_start, sel_end)[0]):
                char_index = f"{sel_start}+{i}c"
                current_tags = self.text_area.tag_names(char_index)
                
                has_bold = 'bold' in current_tags or 'bold_italic' in current_tags
                has_italic = 'italic' in current_tags or 'bold_italic' in current_tags

                self.text_area.tag_remove("bold", char_index)
                self.text_area.tag_remove("italic", char_index)
                self.text_area.tag_remove("bold_italic", char_index)

                if tag_name == 'bold':
                    if has_bold and not has_italic: pass
                    elif has_bold and has_italic: self.text_area.tag_add("italic", char_index)
                    elif not has_bold and has_italic: self.text_area.tag_add("bold_italic", char_index)
                    else: self.text_area.tag_add("bold", char_index)
                
                elif tag_name == 'italic':
                    if has_italic and not has_bold: pass
                    elif has_italic and has_bold: self.text_area.tag_add("bold", char_index)
                    elif not has_italic and has_bold: self.text_area.tag_add("bold_italic", char_index)
                    else: self.text_area.tag_add("italic", char_index)

        except tk.TclError: pass

    def apply_link(self):
        try:
            sel_start = self.text_area.index("sel.first")
            sel_end = self.text_area.index("sel.last")
        except tk.TclError:
            messagebox.showinfo("情報", "リンクを適用するテキストを選択してください。")
            return

        dialog = LinkDialog(self.root)
        url = dialog.result
        if url:
            for tag in self.text_area.tag_names(sel_start):
                if tag.startswith("link_"): self.text_area.tag_remove(tag, sel_start, sel_end)
            
            link_tag_name = f"link_{url}"
            self.text_area.tag_configure(link_tag_name)
            self.text_area.tag_add(link_tag_name, sel_start, sel_end)
            self.text_area.tag_add("link", sel_start, sel_end)

    def update_status(self, message):
        self.status_bar.config(text=message)

if __name__ == "__main__":
    try:
        import bs4
    except ImportError:
        import subprocess, sys
        messagebox.showinfo("ライブラリのインストール", "HTML解析ライブラリ (BeautifulSoup4) が必要です。インストールを試みます。")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "beautifulsoup4"])
        except Exception as e:
            messagebox.showerror("インストール失敗", f"BeautifulSoup4のインストールに失敗しました。\n{e}\n\n手動でインストールしてください: pip install beautifulsoup4")
            sys.exit(1)

    root = tk.Tk()
    app = HtmlEditor(root)
    root.mainloop()
