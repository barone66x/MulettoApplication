using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ConsoleApp1
{
    internal class Program
    {
        static async Task Main(string[] args)
        {
            using (var cts = new MulettoApplicationDBEntities())
            {
                var x = await cts.Bobine.ToListAsync();
                Console.ReadKey();
            }

        }
    }
}
