// Test: Basic try-catch block
public class ExceptionHandler
{
    public int SafeDivide(int a, int b)
    {
        try
        {
            return a / b;
        }
        catch (DivideByZeroException ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            return 0;
        }
    }
}