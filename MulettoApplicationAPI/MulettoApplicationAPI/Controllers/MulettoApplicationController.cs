using Microsoft.AspNetCore.Mvc;

using MulettoApplicationAPI.Entities;
using MulettoApplicationAPI.Repositories;
using System.Diagnostics;

namespace MulettoApplicationAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class MulettoApplicationController : ControllerBase
    {

        private readonly ILogger<MulettoApplicationController> _logger;
        private DbRepository _dbRepo;

        public MulettoApplicationController(ILogger<MulettoApplicationController> logger, DbRepository dbRepo)
        {
            _logger = logger;
            _dbRepo = dbRepo;
        }

        [HttpGet("/bobine")]
        public async Task<IActionResult> GetBobine()
        {
            var res = await _dbRepo.GetBobine();
            
            return Ok(res);
        }


        [HttpGet("/floors")]
        public async Task<IActionResult> GetFloors()
        {
           
            var res = await _dbRepo.GetFloors();
       
            return Ok(res);
        }

        [HttpGet("/missions")]
        public async Task<IActionResult>GetMissions()
        {

            var res = await _dbRepo.GetMissions();

            return Ok(res);
        }

        [HttpGet("/bobineEsterne")]
        public async Task<IActionResult> GetBobineEsterne()
        {

            var res = await _dbRepo.GetBobineEsterne();

            return Ok(res);
        }
    }
}