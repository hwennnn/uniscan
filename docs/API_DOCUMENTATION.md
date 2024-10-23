# API Documentation

## Base URL

`http://localhost:8000/api/v1`

## Endpoints

### 1. Get Latest Ethereum Price

- **Endpoint:** `/eth-price`
- **Method:** `GET`
- **Description:** Retrieves the latest Ethereum price.
- **Response:**

    ```json
    {
        "id": "716be47a-e10b-41ca-a3b1-055f9bb7b011",
        "price": 2553.47,
        "timestamp": "2024-10-23T15:18:09.139Z"
    }
    ```

- **Note:** Returns `null` if no price data is available.

### 2. Get Transactions Summary

- **Endpoint:** `/transactions/summary`
- **Method:** `GET`
- **Description:** Retrieves the summary of all stored transactions since the server started.
- **Response:**

    ```json
    {
        "id": "1009e259-6d7b-4052-974b-7b46b9a0fab6",
        "totalTxns": 42,
        "totalFeeETH": 0.6920108130930664,
        "totalFeeUSDT": 1769.303982473037,
        "updatedAt": "2024-10-23T15:18:50.891Z"
    }
    ```

- **Note:** Returns `null` if no summary is found.

### 3. Get Transaction by Hash

- **Endpoint:** `/transactions/:hash`
- **Method:** `GET`
- **Description:** Retrieves a specific transaction by its hash.
- **Parameters:**
  - `hash` (string): The hash of the transaction.
- **Response:**

    ```json
    {
        "transactionHash": "0x8395927f2e5f97b2a31fd63063d12a51fa73438523305b5b30e7bec6afb26f48",
        "feeInEth": "0.010489394931215424",
        "feeInUsdt": "27.389698256491087"
    }
    ```

- **Note:** Throws a `404` error if the transaction is not found.

### 4. Get List of Transactions

- **Endpoint:** `/transactions`
- **Method:** `GET`
- **Description:** Retrieves a list of transactions based on provided query parameters.
- **Query Parameters:**
  - `cursor` (optional string): An optional string to paginate through the transactions.
  - `offset` (optional number string): An optional number string to specify the starting point of the transactions.
  - `take` (optional number string): An optional number string to specify the number of transactions to retrieve, with values between 10 and 50.

- **Defaults:**
  - `cursor`: `undefined`
  - `offset`: `0`
  - `take`: `50`

- **Response:**

    ```json
    {
        "transactions": [
            {
                "id": 47,
                "transactionHash": "0x89aa61a5a35916418fbb52646d107b6da0fc5aeff3f2726ae49d1d773a0c0c81",
                "blockNumber": "21029152",
                "timestamp": "2024-10-23T15:21:35.000Z",
                "sender": "0xEA8cf32e4aC03ACaB2BabB9028Bac5c853e0Ce80",
                "recipient": "0xEA8cf32e4aC03ACaB2BabB9028Bac5c853e0Ce80",
                "feeInEth": "0.027720705322221792",
                "feeInUsdt": "70.70110451022023"
            },
            {
                "id": 46,
                "transactionHash": "0x11eb1b7cb7c34fb5b9647f235d1b8e95cd29d8f58fd8406465215d9674c12879",
                "blockNumber": "21029149",
                "timestamp": "2024-10-23T15:20:59.000Z",
                "sender": "0x1f2F10D1C40777AE1Da742455c65828FF36Df387",
                "recipient": "0x1f2F10D1C40777AE1Da742455c65828FF36Df387",
                "feeInEth": "0.016067836439326005",
                "feeInUsdt": "40.95305880309655"
            },
            {
                "id": 45,
                "transactionHash": "0xaa1e3aa7580a314aaa063364b926dd1762c14ff77f1ae9bc098508053c295581",
                "blockNumber": "21029148",
                "timestamp": "2024-10-23T15:20:47.000Z",
                "sender": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
                "recipient": "0x22F9dCF4647084d6C31b2765F6910cd85C178C18",
                "feeInEth": "0.019761370126282134",
                "feeInUsdt": "50.344461761118886"
            },
            {
                "id": 44,
                "transactionHash": "0x23efed4eaf12fbc1df2afbe55ebf501608aa006926dddb5905db33b96b1fbf63",
                "blockNumber": "21029143",
                "timestamp": "2024-10-23T15:19:47.000Z",
                "sender": "0x68d3A973E7272EB388022a5C6518d9b2a2e66fBf",
                "recipient": "0x68d3A973E7272EB388022a5C6518d9b2a2e66fBf",
                "feeInEth": "0.011000049253042432",
                "feeInUsdt": "28.061235645003777"
            },
            {
                "id": 43,
                "transactionHash": "0x20668395d2aafa4e2f80420e924ef70c73ed12c14f0adb1c44b1326e0b579212",
                "blockNumber": "21029139",
                "timestamp": "2024-10-23T15:18:59.000Z",
                "sender": "0x51C72848c68a965f66FA7a88855F9f7784502a7F",
                "recipient": "0x51C72848c68a965f66FA7a88855F9f7784502a7F",
                "feeInEth": "0.01442273823885861",
                "feeInUsdt": "36.73471429437288"
            },
            {
                "id": 42,
                "transactionHash": "0x71f6556bf837100a05391f00289da94577a16e18a11439bd4effcbb10386104b",
                "blockNumber": "21029138",
                "timestamp": "2024-10-23T15:18:47.000Z",
                "sender": "0xA69babEF1cA67A37Ffaf7a485DfFF3382056e78C",
                "recipient": "0xA69babEF1cA67A37Ffaf7a485DfFF3382056e78C",
                "feeInEth": "0.009552256767484994",
                "feeInUsdt": "24.350708474240424"
            },
            {
                "id": 41,
                "transactionHash": "0xaa6588aa56352fd4a270fd7cc9ad7a2c419ecfc0a489683ee66f7ae68c951802",
                "blockNumber": "21029136",
                "timestamp": "2024-10-23T15:18:23.000Z",
                "sender": "0x68d3A973E7272EB388022a5C6518d9b2a2e66fBf",
                "recipient": "0x68d3A973E7272EB388022a5C6518d9b2a2e66fBf",
                "feeInEth": "0.042125912918353094",
                "feeInUsdt": "107.44803852606813"
            },
            {
                "id": 40,
                "transactionHash": "0xd1f00d96e1c31e39099c673cf834959d943b070735a8f0e094e7e75b8927cdb9",
                "blockNumber": "21029135",
                "timestamp": "2024-10-23T15:18:11.000Z",
                "sender": "0x3451B6b219478037a1AC572706627FC2BDa1e812",
                "recipient": "0x3451B6b219478037a1AC572706627FC2BDa1e812",
                "feeInEth": "0.008699525238945181",
                "feeInUsdt": "22.21258478785112"
            },
            {
                "id": 39,
                "transactionHash": "0x0030e7d46baf023fbc798770d93dd87d8d7bdbc8e286538c9292779b2779dd34",
                "blockNumber": "21029134",
                "timestamp": "2024-10-23T15:17:59.000Z",
                "sender": "0x3451B6b219478037a1AC572706627FC2BDa1e812",
                "recipient": "0x3451B6b219478037a1AC572706627FC2BDa1e812",
                "feeInEth": "0.008779377833236263",
                "feeInUsdt": "22.431222570140317"
            },
            {
                "id": 38,
                "transactionHash": "0x85e47ba7beed1b797fa43fc0dec29032aa4713e7cedb5d6a4dd80dcac41c559a",
                "blockNumber": "21029131",
                "timestamp": "2024-10-23T15:17:23.000Z",
                "sender": "0x3451B6b219478037a1AC572706627FC2BDa1e812",
                "recipient": "0x3451B6b219478037a1AC572706627FC2BDa1e812",
                "feeInEth": "0.0073880717985215",
                "feeInUsdt": "18.8771883716843"
            }
        ],
        "totalPages": 5,
        "currentPage": 1
    }
    ```

### 5. Get Historical Transactions

- **Endpoint:** `/transactions/history`
- **Method:** `GET`
- **Description:** Retrieves historical transactions within the specified date range.
- **Query Parameters:**
  - `dateFrom` (required string)
  - `dateTo` (required string)

- **Response:**

    ```json
   {
        "id": 17,
        "startBlock": 21006193,
        "endBlock": 21006791,
        "dateFrom": "1729420100856",
        "dateTo": "1729427300000",
        "totalFeeInEth": 0,
        "totalFeeInUsdt": 0,
        "totalTxns": 0,
        "status": "PENDING",
        "updatedAt": "2024-10-23T06:52:55.529Z"
    }
    ```

- **Note:** Returns the newly created batch job details.

### 6. Get Historical Transaction Batch Info

- **Endpoint:** `/transactions/history/:batchId/info`
- **Method:** `GET`
- **Description:** Retrieves information about a specific historical transaction batch.
- **Parameters:**
  - `batchId` (string): The ID of the historical transaction batch.
- **Response:**

    ```json
   {
        "id": 32,
        "startBlock": 21015011,
        "endBlock": 21027608,
        "dateFrom": "1729526400000",
        "dateTo": "1729678314470",
        "totalFeeInEth": 42.10145789110724,
        "totalFeeInUsdt": 108634.0587773264,
        "totalTxns": 4924,
        "status": "IN_PROGRESS",
        "updatedAt": "2024-10-23T10:12:55.132Z"
    }
    ```

### 7. Get Transactions from Historical Batch

- **Endpoint:** `/transactions/history/:batchId`
- **Method:** `GET`
- **Description:** Retrieves transactions from a specific historical transaction batch.
- **Parameters:**
  - `batchId` (string): The ID of the historical transaction batch.
- **Query Parameters:**
  - `offset` (optional number string): An optional number string to specify the starting point of the transactions.
  - `take` (optional number string): An optional number string to specify the number of transactions to retrieve, with values between 10 and 50.

- **Defaults:**
  - `offset`: `0`
  - `take`: `50`
  
- **Response:**

    ```json
  {
        "transactions": [
            {
                "id": 23063,
                "transactionHash": "0x5dc93d2515081ecedef0dbedd7955d04154349e999970f8f9217719f213ac6af",
                "feeInEth": "0.003617619791588712",
                "feeInUsdt": "9.485616150733097",
                "batchId": 14
            },
            {
                "id": 23062,
                "transactionHash": "0x18918b7cfb70afc22de528ac1d51d0986d5b867eda741004929feb0e30f19560",
                "feeInEth": "0.004808044442281302",
                "feeInUsdt": "12.606981010328111",
                "batchId": 14
            },
            {
                "id": 23061,
                "transactionHash": "0x3cfa22c750138988319771994b9a126c14afe16589dbc7b4e5fbaf2bc492c679",
                "feeInEth": "0.0040220159685",
                "feeInUsdt": "10.54596719036511",
                "batchId": 14
            },
            {
                "id": 23060,
                "transactionHash": "0x54b8376d6813063e25335efaa97ebb47bf37f09b115a09d70ff289399f61122e",
                "feeInEth": "0.00328323594340737",
                "feeInUsdt": "8.608841637770729",
                "batchId": 14
            },
            {
                "id": 23059,
                "transactionHash": "0x97fb1a4a574f234d80ebfecfbd36094b11b9c0a0ebf2a06ea5409d54661df715",
                "feeInEth": "0.003337109216514318",
                "feeInUsdt": "8.750100592253533",
                "batchId": 14
            },
            {
                "id": 23058,
                "transactionHash": "0xf2fe96403770aef8cb38bd2f80bc8b6cbd1f62aaf9a8ce05e16cf80d5b4e18ee",
                "feeInEth": "0.00294108472458602",
                "feeInUsdt": "7.71170061294802",
                "batchId": 14
            },
            {
                "id": 23057,
                "transactionHash": "0xebdd59faed6bc647e59b3aca1bc36288d518ecb762aecb64a4a30c145d05b554",
                "feeInEth": "0.005139706975637572",
                "feeInUsdt": "13.476620072540253",
                "batchId": 14
            },
            {
                "id": 23056,
                "transactionHash": "0xaace0209dea42152995090aad098d0207484bb71fb8248dbf7e7e6f8e3fcc775",
                "feeInEth": "0.003486646572790752",
                "feeInUsdt": "9.142196512651719",
                "batchId": 14
            },
            {
                "id": 23055,
                "transactionHash": "0x2231d21a027b0a738cd3560d65bef25a8f5769028858f8b83f0984337fda4b9a",
                "feeInEth": "0.049231032155877632",
                "feeInUsdt": "129.0867201746405",
                "batchId": 14
            },
            {
                "id": 23054,
                "transactionHash": "0xbe7a047e379a2062f826018c3a688c0f14fc9733165991b3fb4f3aa8ac27ea7c",
                "feeInEth": "0.003388458774518784",
                "feeInUsdt": "8.884742214314723",
                "batchId": 14
            }
        ],
        "totalPages": 20,
        "currentPage": 1
    }
    ```
