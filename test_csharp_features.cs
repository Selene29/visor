using System;
using System.Collections.Generic;
using System.Linq;

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

        // Additional test cases with common C# patterns
        public bool IsValidEmail(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return false;
            }

            if (!email.Contains("@"))
            {
                return false;
            }

            string[] parts = email.Split('@');
            if (parts.Length != 2)
            {
                return false;
            }

            return !string.IsNullOrEmpty(parts[0]) && !string.IsNullOrEmpty(parts[1]);
        }

        public decimal CalculateDiscount(decimal price, int customerType, bool hasLoyaltyCard)
        {
            decimal discount = 0;

            switch (customerType)
            {
                case 1: // Regular customer
                    discount = hasLoyaltyCard ? 0.05m : 0.02m;
                    break;
                case 2: // Premium customer
                    discount = hasLoyaltyCard ? 0.15m : 0.10m;
                    break;
                case 3: // VIP customer
                    discount = hasLoyaltyCard ? 0.25m : 0.20m;
                    break;
                default:
                    discount = 0;
                    break;
            }

            return price * discount;
        }

        public List<int> ProcessNumbers(List<int> numbers)
        {
            var result = new List<int>();
            
            for (int i = 0; i < numbers.Count; i++)
            {
                int current = numbers[i];
                
                if (current < 0)
                {
                    continue;
                }
                
                if (current > 100)
                {
                    break;
                }
                
                if (current % 2 == 0)
                {
                    result.Add(current * 2);
                }
                else
                {
                    result.Add(current + 1);
                }
            }
            
            return result;
        }

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
            catch (Exception ex)
            {
                Console.WriteLine($"General Error: {ex.Message}");
                throw;
            }
        }

        public int Factorial(int n)
        {
            if (n <= 1)
            {
                return 1;
            }

            int result = 1;
            while (n > 1)
            {
                result *= n;
                n--;
            }

            return result;
        }

        public void ProcessCustomers(Customer[] customers)
        {
            foreach (var customer in customers)
            {
                if (customer == null)
                    continue;

                try
                {
                    if (customer.Age < 18)
                    {
                        customer.Category = "Minor";
                    }
                    else if (customer.Age >= 65)
                    {
                        customer.Category = "Senior";
                    }
                    else
                    {
                        customer.Category = "Adult";
                    }

                    customer.IsProcessed = true;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error processing customer {customer.Id}: {ex.Message}");
                    customer.IsProcessed = false;
                }
            }
        }
    }

    public class Customer
    {
        public int Id { get; set; }
        public int Age { get; set; }
        public string Category { get; set; }
        public bool IsProcessed { get; set; }
    }
}