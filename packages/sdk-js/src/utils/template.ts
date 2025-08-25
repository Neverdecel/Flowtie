export class TemplateEngine {
  static interpolate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (key in variables) {
        const value = variables[key];
        return typeof value === 'string' ? value : JSON.stringify(value);
      }
      return match;
    });
  }

  static extractVariables(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];

    return matches
      .map(match => match.replace(/[\{\}]/g, ''))
      .filter((value, index, self) => self.indexOf(value) === index);
  }

  static validateVariables(
    template: string,
    variables: Record<string, any>
  ): { valid: boolean; missing: string[] } {
    const required = this.extractVariables(template);
    const provided = Object.keys(variables);
    const missing = required.filter(key => !provided.includes(key));

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}