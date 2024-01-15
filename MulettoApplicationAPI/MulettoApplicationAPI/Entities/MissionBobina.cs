namespace MulettoApplicationAPI.Entities
{
    public class MissionBobina
    {
        public int id { get; set; }
        public int bobinaId { get; set; }
        public int destinationId { get; set; }

        public MissionBobina(int id, int bobinaId, int destinationId)
        {
            this.id = id;
            this.bobinaId = bobinaId;
            this.destinationId = destinationId;
        }
    }
}
