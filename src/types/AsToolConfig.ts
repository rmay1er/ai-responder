export interface AsToolConfig {
  name: string;
  description: string;
  /**
   * Optional function called when tool is executed.
   * Receives a question string as parameter.
   */
  function?: (question?: any) => void;
}
