import http from 'http';
import { fetch } from 'undici';

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,DELETE,PROPFIND,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Depth, Destination, Overwrite, X-Requested-With",
  "Access-Control-Max-Age": "86400"
};

const METHODS_WITH_BODY = new Set(["PUT", "POST", "PATCH"]);

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    const upstreamUrl = new URL(req.url ?? "/", "https://dav.jianguoyun.com");
    const fetchOpts = {
      method: req.method,
      headers: req.headers,
      redirect: "follow"
    };

    if (METHODS_WITH_BODY.has(req.method)) {
      fetchOpts.body = req;
      fetchOpts.duplex = "half";
    }

    const upstreamRes = await fetch(upstreamUrl, fetchOpts);

    // 设置CORS头
    Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

    // 状态码
    res.writeHead(upstreamRes.status);

    // ✅Web ReadableStream 使用 pipeTo，不要使用 .pipe()
    if (upstreamRes.body) {
      // Node http.ServerResponse 可以作为 WritableStream
      await upstreamRes.body.pipeTo(new WritableStream({
        write(chunk) {
          res.write(chunk);
        },
        close() {
          res.end();
        },
        abort(err) {
          res.destroy(err);
        }
      }));
    } else {
      res.end();
    }

  } catch (err) {
    console.error("代理异常：", err);
    // 防止头已经发送再writeHead
    if (!res.headersSent) {
      res.writeHead(500);
    }
    res.end("proxy error:" + err.message);
  }
});

// 原来：server.listen(8000, "0.0.0.0", () => {
server.listen(8081, "0.0.0.0", () => {
  console.log("✅本地WebDAV代理已启动");
  console.log("本机访问地址：http://127.0.0.1:8081");
  console.log("局域网其他设备：http://192.168.0.200:8081");
});
