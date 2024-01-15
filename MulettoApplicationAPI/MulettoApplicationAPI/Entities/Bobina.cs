namespace MulettoApplicationAPI.Entities
{
    public class Bobina
    {

        private int id;
        private int floorId;
        private Point position;
        private double @base;
        private double height;
        private double depth;
        private double rotation;
        private bool isStanding;

        public int Id { get => id; set => id = value; }
        public int FloorId { get => floorId; set => floorId = value; }
        public Point Position { get => position; set => position = value; }
        public double Base { get => @base; set => @base = value; }
        public double Height { get => height; set => height = value; }
        public double Depth { get => depth; set => depth = value; }
        public double Rotation { get => rotation; set => rotation = value; }
        public bool IsStanding { get => isStanding; set => isStanding = value; }

        public Bobina(int id, int floorId, double x, double y, double @base, double height, double depth, double rotation, bool isStanding)
        {
            this.Id = id;
            this.FloorId = floorId;
            this.Position = new Point(x, y);
            this.Base = @base;
            this.Height = height;
            this.Depth = depth;
            this.Rotation = rotation;
            this.IsStanding = isStanding;
        }
    }
}
