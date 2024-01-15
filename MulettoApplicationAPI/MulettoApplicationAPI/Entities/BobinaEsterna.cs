namespace MulettoApplicationAPI.Entities
{
    public class BobinaEsterna
    {
        public int id { get; set; }
        public double @base { get; set; }
        public double height { get; set; }
        public double depth { get; set; }

        public BobinaEsterna(int id, double @base, double height, double depth)
        {
            this.id = id;
            this.@base = @base;
            this.height = height;
            this.depth = depth;
        }
    }
}
