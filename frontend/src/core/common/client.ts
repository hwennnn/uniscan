import axios, { AxiosInstance } from "axios";

/**
 * Creates an Axios client instance with predefined configuration.
 *
 * The client is configured with the following settings:
 * - `baseURL`: The base URL for all requests is set to "/api".
 * - `headers`: The default headers for all requests include "Content-Type: application/json".
 *
 * @constant
 * @type {AxiosInstance}
 */
const client: AxiosInstance = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

export default client;
