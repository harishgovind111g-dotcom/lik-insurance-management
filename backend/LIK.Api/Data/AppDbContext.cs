using LIK.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LIK.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<InsuranceCategory> Categories => Set<InsuranceCategory>();
    public DbSet<InsurancePlan> Plans => Set<InsurancePlan>();
    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<InsuranceClaim> Claims => Set<InsuranceClaim>();
    public DbSet<ClaimEvent> ClaimEvents => Set<ClaimEvent>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // Short columns get a maximum length (stored as varchar(n) in PostgreSQL).
        b.Entity<AppUser>(e =>
        {
            e.Property(x => x.Email).HasMaxLength(200);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Role).HasMaxLength(20);
        });

        b.Entity<InsuranceCategory>(e =>
        {
            e.Property(x => x.Slug).HasMaxLength(40);
            e.HasIndex(x => x.Slug).IsUnique();
        });

        b.Entity<Policy>(e =>
        {
            e.Property(x => x.PolicyNumber).HasMaxLength(40);
            e.HasIndex(x => x.PolicyNumber).IsUnique();

            // Deleting a user or plan must not silently delete their policies.
            e.HasOne(x => x.User).WithMany(u => u.Policies).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Plan).WithMany().HasForeignKey(x => x.PlanId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<InsuranceClaim>(e =>
        {
            e.Property(x => x.ClaimNumber).HasMaxLength(40);
            e.HasIndex(x => x.ClaimNumber).IsUnique();

            e.HasOne(x => x.Policy).WithMany(p => p.Claims).HasForeignKey(x => x.PolicyId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<ClaimEvent>(e =>
        {
            e.HasOne(x => x.Claim).WithMany(c => c.Events).HasForeignKey(x => x.ClaimId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
