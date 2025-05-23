import { getApiDomain } from "@/utils/domain";
import { ApplicationError } from "@/types/error";

export class ApiService {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseURL = `${getApiDomain()}`;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    };
  }
  

  /**
   * Helper function to check the response, parse JSON,
   * and throw an error if the response is not OK.
   *
   * @param res - The response from fetch.
   * @param errorMessage - A descriptive error message for this call.
   * @returns Parsed JSON data.
   * @throws ApplicationError if res.ok is false.
   */
  private async processResponse<T>(
    res: Response,
    errorMessage: string,
  ): Promise<T> {
    if (!res.ok) {
      let errorDetail = res.statusText;
      try {
        const errorInfo = await res.json();
        if (errorInfo?.message) {
          errorDetail = errorInfo.message;
        } else {
          errorDetail = JSON.stringify(errorInfo);
        }
      } catch {
        // If parsing fails, keep using res.statusText
      }
      const detailedMessage = `${errorMessage} (${res.status}: ${errorDetail})`;
      const error: ApplicationError = new Error(
        detailedMessage,
      ) as ApplicationError;
      error.info = JSON.stringify(
        { status: res.status, statusText: res.statusText },
        null,
        2,
      );
      error.status = res.status;
      throw error;
    }
    return res.headers.get("Content-Type")?.includes("application/json")
      ? res.json() as Promise<T>
      : Promise.resolve(res as T);
  }

  /**
   * GET request.
   * @param endpoint - The API endpoint (e.g. "/users").
   * @returns JSON data of type T.
   */
  public async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders,
    });
    return this.processResponse<T>(
      res,
      "An error occurred while fetching the data.\n",
    );
  }

  /**
   * POST request.
   * @param endpoint - The API endpoint (e.g. "/users").
   * @param data - The payload to post.
   * @returns JSON data of type T.
   */
  public async post<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.defaultHeaders,
      body: JSON.stringify(data),
    });
    return this.processResponse<T>(
      res,
      "An error occurred while posting the data.\n",
    );
  }

  /**
   * PUT request.
   * @param endpoint - The API endpoint (e.g. "/users/123").
   * @param data - The payload to update.
   * @returns JSON data of type T.
   */
  public async put<T>(
    endpoint: string,
    data: unknown,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        ...this.defaultHeaders,
        ...customHeaders, // 合并 Authorization header
      },
      body: JSON.stringify(data),
    });
    return this.processResponse<T>(
      res,
      "An error occurred while updating the data.\n"
    );
  }
  
  
  

  /**
   * DELETE request.
   * @param endpoint - The API endpoint (e.g. "/users/123").
   * @returns JSON data of type T.
   */
  public async delete<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: this.defaultHeaders,
    });
    return this.processResponse<T>(
      res,
      "An error occurred while deleting the data.\n",
    );
  }

  /**
   * Fetches the leaderboard data.
   * @param token - Authentication token for the request.
   * @returns A Promise resolving to an array of LeaderboardEntry objects.
   */
  public async getLeaderboard<T>(token: string): Promise<T> {
    // 调试信息
    console.log("baseURL before:", this.baseURL);
    
    // 确保baseURL格式正确
    let baseURL = this.baseURL;
    if (baseURL.includes(":3000") && !baseURL.startsWith("http")) {
      baseURL = "http://localhost" + baseURL;
      console.log("Fixed baseURL:", baseURL);
    }
    
    const endpoint = "/users/leaderboard";
    const url = `${baseURL}${endpoint}`;
    
    console.log("Final URL:", url);
    
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...this.defaultHeaders,
        "Authorization": `Bearer ${token}`
      },
    });
    
    return this.processResponse<T>(
      res,
      "An error occurred while fetching the leaderboard data.\n"
    );
  }

}

