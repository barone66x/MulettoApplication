namespace MulettoApplicationAPI.Entities
{
    public class Mission
    {
        public int id { get; set; }
        public List<int> bobine { get; set; }
        public int destinationArea { get; set; }

        public Mission(int id, List<int> bobine, int destinationArea)
        {
            this.id = id;
            this.bobine = bobine;
            this.destinationArea = destinationArea;
        }
    }
}
