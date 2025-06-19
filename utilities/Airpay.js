import crypto from "crypto"
import axios from "axios";

class AirpayUPI {
    constructor({ username, password, secret, mercid }) {
        this.username = username;
        this.password = password;
        this.secret = secret;
        this.mercid = mercid;

        this.key256 = crypto
            .createHash("sha256")
            .update(`${this.username}~:~${this.password}`)
            .digest("hex");

        this.encKey = crypto.createHash("md5").update(this.secret).digest("hex");
    }

    #generateChecksum({ orderid, amount, buyerPhone, buyerEmail, mer_dom, call_type }) {
        const alldata = `${this.mercid}${orderid}${amount}${buyerPhone}${buyerEmail}${mer_dom}${call_type}${new Date()
            .toISOString()
            .slice(0, 10)}`;

        return crypto
            .createHash("sha256")
            .update(`${this.key256}@${alldata}`)
            .digest("hex");
    }

    #encryptText(plainText) {
        const iv = crypto.randomBytes(8).toString("hex");
        const cipher = crypto.createCipheriv("aes-256-cbc", this.encKey, iv);
        let encrypted = cipher.update(plainText, "utf8", "base64");
        encrypted += cipher.final("base64");
        return iv + encrypted;
    }

    #decryptText(encrypted) {
        const iv = encrypted.substring(0, 16);
        const data = encrypted.substring(16);
        const decipher = crypto.createDecipheriv("aes-256-cbc", this.encKey, iv);
        let decrypted = decipher.update(Buffer.from(data, "base64"), "binary", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted || encrypted;
    }

    async generateUPI({ orderid, amount, buyerPhone, buyerEmail }) {
        const mer_dom = "aHR0cHM6Ly9taW5kbWF0cml4MTEuY29t";
        const call_type = "upiqr";

        const fields = {
            mercid: this.mercid,
            orderid,
            amount,
            buyerPhone,
            buyerEmail,
            mer_dom,
            call_type,
        };

        const checksum = this.#generateChecksum({ orderid, amount, buyerPhone, buyerEmail, mer_dom, call_type });
        const encData = this.#encryptText(JSON.stringify(fields));

        const post_fields = JSON.stringify({
            encData,
            checksum,
            mercid: this.mercid,
        });

        console.log("POST START", post_fields, "POST END");

        try {
            const response = await axios.post("https://payments.airpay.co.in/api/generateUpiQr.php", post_fields, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log("Response:", response.data);

            const decrypted = this.#decryptText(response.data.data);
            return decrypted;

            return decrypted;
        } catch (error) {
            console.error("Error:", error.message);
            throw error;
        }
    }
}

export default new AirpayUPI({
    username: "yRM8yEFaqf",
    password: "aaqK4PGE",
    secret: "5rTJ85CcN7Q9p3su",
    mercid: "339697",
})
