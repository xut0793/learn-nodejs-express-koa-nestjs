/*
 * @Date         : 2024-01-10 19:43:05 星期3
 * @Author       : xut
 * @Description  : @nestjs/config 默认的验证器是 joi，
 * 可以通过 forRoot({validationSchema, validationOptions}) 设置 joi 验证模式。
 *
 * 默认情况下，未知环境变量（其键不存在于模式中的环境变量）是允许的，并且不会触发验证异常。
 * 默认情况下，报告所有验证错误。 你可以通过 forRoot() 选项对象的 validationOptions 键传递一个选项对象来改变这些行为。
 * - allowUnknown: 控制是否允许环境变量中的未知键。 默认为 true
 * - abortEarly: 如果为真，则在出现第一个错误时停止验证； 如果为假，则返回所有错误。 默认为 false。
 */
import { SafeParseError, z } from 'nestjs-zod/z';

const envConfigSchema = z.object({
  BAR: z.string(),
  FOO_BAR: z.string(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

type envConfig = z.infer<typeof envConfigSchema>;

export function envConfigValidate(config: Record<string, unknown>) {
  // 默认情况下，Zod 对象的模式在解析过程中会剥离出未被识别的 keys，但为了保持符合 nestjs 默认验证器 joi 的默认行为：
  // 使用.passthrough()，通过未知的 keys。
  // 例用 safeParse，自行处理验证错误，即返回所有验证错误。

  const result = envConfigSchema.passthrough().safeParse(config);

  if (result.success) {
    return result.data;
  } else {
    throw new Error(
      JSON.stringify((result as SafeParseError<envConfig>).error.format()),
    );
  }
}
