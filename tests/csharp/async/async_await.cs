// Test: Async method with await
public class AsyncProcessor
{
    public async Task<string> FetchDataAsync(string url)
    {
        try
        {
            using (var client = new HttpClient())
            {
                var response = await client.GetStringAsync(url);
                return response;
            }
        }
        catch (HttpRequestException ex)
        {
            Console.WriteLine($"HTTP Error: {ex.Message}");
            return null;
        }
    }
}