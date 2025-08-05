// Test: Foreach loop
public class LoopProcessor
{
    public int SumPositive(int[] numbers)
    {
        int sum = 0;
        
        foreach (int number in numbers)
        {
            if (number > 0)
            {
                sum += number;
            }
        }
        
        return sum;
    }
}