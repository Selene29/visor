// Test: Try-catch-finally block with actual content
public class ExceptionHandler
{
    public int ComplexCalculation(int[] numbers)
    {
        int result = 0;

        try
        {
            result = numbers.Sum() / numbers.Length;
        }
        catch (DivideByZeroException ex)
        {
            Console.WriteLine($"Division error: {ex.Message}");
            result = 0;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"General error: {ex.Message}");
            result = -1;
        }
        finally
        {
            Console.WriteLine("Calculation completed");
            Console.WriteLine($"Final result: {result}");
        }

        return result;
    }
}