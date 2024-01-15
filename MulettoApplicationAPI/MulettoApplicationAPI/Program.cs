using MulettoApplicationAPI;

using Microsoft.EntityFrameworkCore;
using MulettoApplicationAPI.Repositories;
using Microsoft.AspNetCore.Cors;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddCors(options =>
{
    // default policy 
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin();
        policy.AllowAnyHeader();
        policy.AllowAnyMethod();
    });
});


builder.Services.AddScoped<DbRepository, DbRepository>();
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseRouting();
app.UseAuthorization();

//app.MapControllers();
//app.MapGet("/check", [EnableCors] () => "hello api check");

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
});

app.Run();


