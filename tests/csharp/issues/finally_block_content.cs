// Test: Finally block with actual content issue from comments
public class ExceptionHandler
{
    public int ComplexCalculation(int[] numbers)
    {
        int result = 0;
        
        foreach (int number in numbers)
        {
            if (number > 0)
            {
                result += number % 2 == 0 ? number * 2 : number;
            }
            else if (number < 0)
            {
                result -= Math.Abs(number);
            }
        }

        try
        {
            result = result / numbers.Length;
        }
        catch (DivideByZeroException ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            result = 0;
        }
        finally
        {
            Console.WriteLine("Calculation completed");
        }

        return result;
    }
}