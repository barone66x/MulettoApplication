namespace MulettoApplicationAPI.Entities
{
    public class Floor
    {
        public int id { get; set; }
        public string name { get; set; }
        public Point point1 { get; set; }
        public Point point2 { get; set; }
        public Point point3 { get; set; }
        public Point point4 { get; set; }

        public Floor(int id, string name, double x1, double y1, double x2,double y2, double x3, double y3, double x4, double y4)
        {
            this.id = id;
            this.name = name;
            this.point1 = new Point(x1,y1);
            this.point2 = new Point(x2, y2);
            this.point3 = new Point(x3, y3);
            this.point4 = new Point(x4, y4);
        }
    }
}
