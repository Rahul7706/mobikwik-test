const encryptRequest = require("./encrypt-body");
const axios = require("axios");


class test_case {
  static generateCurl = (options) => {
    let curl = `curl -X ${options.method.toUpperCase()} "${options.url}"`;

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        curl += ` \\\n  -H "${key}: ${value}"`;
      }
    }

    if (options.data) {
      curl += ` \\\n  -d '${JSON.stringify(options.data)}'`;
    }

    return curl;
  };

  static commonReq_apis = async (
    request_type,
    request_url,
    request_body,
    method,
    token,
    publicKey,
  ) => {
    try {
      let options = {
        method: method.toUpperCase(),
        url: request_url,
        headers: {
          "Content-Type": "application/json",
        },
        data: request_body,
      };

      if (token && !request_type?.toLowerCase()?.includes("token generation")) {
        options.headers["Authorization"] = token;
      }

      if (!request_type?.toLowerCase()?.includes("token generation")) {
        options.data = await encryptRequest(request_body, publicKey, "1.0");
      }

      const response = await axios(options);

      const curlCommand = test_case.generateCurl(options);

      let test_result = {
        [request_type]: {
          CURL: curlCommand,
          "Request URL": request_url,
          Method: options.method,
          "Request Body": request_body,
          Response: response.data,
          Status: response.status,
          Result: response.status === 200 ? "PASS" : "FAIL"
        },
      };

      // show encrypted + decrypted both
      if (!request_type?.toLowerCase()?.includes("token generation")) {
        test_result[request_type]["Request Body"] = {
          Encrypted: options.data,
          Decrypted: request_body,
        };
      }

      return test_result;
    } catch (error) {
      console.log(error);

      return {
        [request_type]: {
          "Request URL": request_url,
          Method: method,
          "Request Body": request_body,
          Error: error?.response?.data || error.message,
          Status: error?.response?.status || 500,
          Result: "FAIL",
        },
      };
    }
  };
}

module.exports = test_case;
