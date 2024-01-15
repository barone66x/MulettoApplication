using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

using MulettoApplicationAPI.Entities;
using System.Diagnostics;
using System.Linq;

namespace MulettoApplicationAPI.Repositories
{
    public class DbRepository
    {
        SqlConnectionStringBuilder builder;

        public DbRepository( )
        {
            builder = new SqlConnectionStringBuilder();
            builder.UserID = "sa";
            builder.Password = "sa";
            builder.DataSource = "localhost";
            builder.InitialCatalog = "MulettoApplicationDB";

        }

        public async Task<IEnumerable<Bobina>> GetBobine()
        {
            try
            {
                using (SqlConnection connection = new SqlConnection(builder.ConnectionString))
                {

                    connection.Open();

                    var res = new List<Bobina>();

                    String sql = "SELECT * FROM bobine";

                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                              
                                res.Add(new Bobina(Convert.ToInt32(reader["id"]), Convert.ToInt32(reader["floorId"]), Convert.ToDouble(reader["x"]), Convert.ToDouble(reader["y"]), Convert.ToDouble(reader["base"]), Convert.ToDouble(reader["height"]), Convert.ToDouble(reader["depth"]), Convert.ToDouble(reader["rotation"]), Convert.ToBoolean(reader["isStanding"])));
                            }
                        }
                    }
                    Debug.WriteLine(res);
                    return res;

                }
            }
            catch (Exception ex)
            {

                throw new Exception($"GetBobine => generato errore: {ex.Message}");
            }
            
        }

        public async Task<IEnumerable<Floor>> GetFloors()
        {
            try
            {
                using (SqlConnection connection = new SqlConnection(builder.ConnectionString))
                {

                    connection.Open();

                    var res = new List<Floor>();

                    String sql = "SELECT * FROM floors";

                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {

                                res.Add(new Floor(Convert.ToInt32(reader["id"]), Convert.ToString(reader["name"]), Convert.ToDouble(reader["x1"]), Convert.ToDouble(reader["y1"]), Convert.ToDouble(reader["x2"]), Convert.ToDouble(reader["y2"]), Convert.ToDouble(reader["x3"]), Convert.ToDouble(reader["y3"]), Convert.ToDouble(reader["x4"]),Convert.ToDouble(reader["y4"])));
                            }
                        }
                    }
                    Debug.WriteLine(res);
                    return res;

                }
            }
            catch (Exception ex)
            {

                throw new Exception($"GetFloors => generato errore: {ex.Message}");
            }

        }

        public async Task<IEnumerable<BobinaEsterna>> GetBobineEsterne()
        {
            try
            {
                using (SqlConnection connection = new SqlConnection(builder.ConnectionString))
                {

                    connection.Open();

                    var res = new List<BobinaEsterna>();

                    String sql = "SELECT * FROM bobineEsterne";

                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {

                                res.Add(new BobinaEsterna(Convert.ToInt32(reader["id"]), Convert.ToDouble(reader["base"]), Convert.ToDouble(reader["height"]), Convert.ToDouble(reader["depth"])));
                            }
                        }
                    }
                    Debug.WriteLine(res);
                    return res;

                }
            }
            catch (Exception ex)
            {

                throw new Exception($"GetBobineEsterne => generato errore: {ex.Message}");
            }

        }


        public async Task<IEnumerable<Mission>> GetMissions()
        {
            try
            {
                using (SqlConnection connection = new SqlConnection(builder.ConnectionString))
                {

                    connection.Open();

                    var dto = new List<MissionBobina>();
                    
                    var res = new List<Mission>();

                    String sql = "select Missions.id, MissionsBobine.bobinaId, Missions.destinationId from Missions join MissionsBobine on Missions.id = MissionsBobine.missionId";

                    using (SqlCommand command = new SqlCommand(sql, connection))
                    {
                        using (SqlDataReader reader = command.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                dto.Add(new MissionBobina(Convert.ToInt32(reader["id"]), Convert.ToInt32(reader["bobinaId"]), Convert.ToInt32(reader["destinationId"])));
                            }
                            var z = dto.GroupBy(x => x.id).Select(x => new { missionId = x.Key , bobine = x.Select(y => y.bobinaId), destinationArea = x.First().destinationId});

                            foreach(var i in z)
                            {
                                res.Add(new Mission(i.missionId, i.bobine.ToList(), i.destinationArea));
                            } 
                        }
                    }
                    return res;

                }
            }
            catch (Exception ex)
            {

                throw new Exception($"GetBobineEsterne => generato errore: {ex.Message}");
            }

        }
    }

}
