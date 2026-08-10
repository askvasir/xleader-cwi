# xleader-cwi

Chat With Insight — plugin Claude Code giúp đội XLeaders hỏi dữ liệu và dựng báo cáo trên
Metabase `insight.xteam.edu.vn` bằng tiếng Việt.

## Cài plugin từ thư mục local (đã kiểm chứng)

Lệnh CLI trực tiếp **có tồn tại** trên phiên bản Claude Code `2.1.221` và chạy thành công — không
cần rơi xuống biến thể slash-command:

```bash
claude plugin marketplace add ~/project/xleader-cwi
claude plugin install xleader-cwi@xleader-cwi
```

Output thật:

```
Adding marketplace…✔ Successfully added marketplace: xleader-cwi (declared in user settings)
Installing plugin "xleader-cwi@xleader-cwi"...✔ Successfully installed plugin: xleader-cwi@xleader-cwi (scope: user)
```

Xác nhận: `claude mcp list` liệt kê `plugin:xleader-cwi:cwi: node
/Users/johnvu/project/xleader-cwi/plugin/mcp/server.mjs - ✔ Connected`, và `claude plugin list`
liệt kê `xleader-cwi@xleader-cwi ... Status: ✔ enabled`.
