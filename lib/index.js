const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cookie = require("cookie");
const FormData = require("form-data");

async function post(url, formdata = {}, cookies) {
    let encode = encodeURIComponent;
    let body = Object.keys(formdata)
        .map((key) => {
            let vals = formdata[key];
            let isArray = Array.isArray(vals);
            let keys = encode(key + (isArray ? "[]" : ""));
            if (!isArray) vals = [vals];
            let out = [];
            for (let valq of vals) out.push(keys + "=" + encode(valq));
            return out.join("&");
        })
        .join("&");
    return await fetch(`${url}?${body}`, {
        method: "GET",
        headers: {
            Accept: "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "User-Agent": "GoogleBot",
            Cookie: cookies,
        },
    });
}

async function get(url, text) {
    if (!/^https:\/\/textpro\.me\/.+\.html$/.test(url))
        throw new Error("Enter a Valid URL");
    const geturl = await fetch(url, {
        method: "GET",
        headers: {
            "User-Agent": "GoogleBot",
        },
    });
    const load_token = await geturl.text();
    let cookies = geturl.headers.get("set-cookie").split(",").map((v) => cookie.parse(v)).reduce((a, c) => {
        return { ...a, ...c };
    }, {});
    cookies = {
        __cfduid: cookies.__cfduid,
        PHPSESSID: cookies.PHPSESSID
    };
    cookies = Object.entries(cookies)
        .map(([name, value]) => cookie.serialize(name, value))
        .join("; ");
    const $ = cheerio.load(load_token);
    const token = $('input[name="token"]').attr("value");
    const form = new FormData();
    if (typeof text === "string") text = [text];
    for (let texts of text) form.append("text[]", texts);
    form.append("submit", "Go");
    form.append("token", token);
    form.append("build_server", "https://textpro.me");
    form.append("build_server_id", 1);
    const geturl2 = await fetch(url, {
        method: "POST",
        headers: {
            Accept: "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "User-Agent": "GoogleBot",
            Cookie: cookies,
            ...form.getHeaders(),
        },
        body: form.getBuffer(),
    });
    const atoken = await geturl2.text();
    const token2 = /<div.*?id="form_value".+>(.*?)<\/div>/.exec(atoken);
    if (!token2) {
        var status_err = new Object();
        status_err.status = false
        status_err.error = "Error! This token is not acceptable!"
        return status_err;
    }
    const prosesimage = await post(
        "https://textpro.me/effect/create-image",
        JSON.parse(token2[1]),
        cookies
    );
    const image_ret = await prosesimage.json();
    var title = url
    title = title.toLowerCase();
    title = title.replace(/\b[a-z]/g, function (letter) {
        return letter.toUpperCase();
    });
    title = title.split(/https:\/\/textpro.me/i)[1].split(/-[0-9]/ig)[0].slice(1).split('-').join(' ')
return {
    title: title,
    path: url,
    result: `https://textpro.me${image_ret.fullsize_image}`
};
}

module.exports = { get };