import { marked } from "marked";
import DOMPurify from "dompurify";

export class SanitizeLLMResponse {
  static Sanitize(response: string): Promise<string> {
    const sanitizeResponse: any = DOMPurify.sanitize(response);
    return sanitizeResponse;
  }

  static ConvertMarkDownToHtmlString(
    sanitizedResponse: string,
  ): Promise<string> {
    const markDownHtmlString: any = marked(sanitizedResponse);
    return markDownHtmlString;
  }

  static main(originaResponse: string) {
    const sanitized: any = SanitizeLLMResponse.Sanitize(originaResponse);
    const markDownString: any =
      SanitizeLLMResponse.ConvertMarkDownToHtmlString(sanitized);

    return markDownString;
  }
}
