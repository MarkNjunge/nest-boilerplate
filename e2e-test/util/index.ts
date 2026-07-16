export const testApiHost = process.env.TEST_API_HOST ?? "http://localhost:3000";
export const testAdminKey = process.env.TEST_ADMIN_KEY ?? "api-key";

export function randomString(length: number) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

