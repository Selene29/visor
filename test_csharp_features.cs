using System;

namespace TestProject
{
    public class Calculator
    {
        public int Add(int a, int b)
        {
            return a + b;
        }

        public int ComplexCalculation(int[] numbers)
        {
            int result = 0;
            
            foreach (int number in numbers)
            {
                if (number > 0)
                {
                    if (number % 2 == 0)
                    {
                        result += number * 2;
                    }
                    else
                    {
                        result += number;
                    }
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

        public string GetGrade(int score)
        {
            switch (score)
            {
                case >= 90:
                    return "A";
                case >= 80:
                    return "B";
                case >= 70:
                    return "C";
                case >= 60:
                    return "D";
                default:
                    return "F";
            }
        }
    }
}