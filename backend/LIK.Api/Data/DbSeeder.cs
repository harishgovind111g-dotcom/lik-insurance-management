using LIK.Api.Models;

namespace LIK.Api.Data;

/// <summary>Fills an empty database with sample categories, plans, users, policies and claims.</summary>
public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        if (db.Users.Any())
        {
            return;
        }

        // ---------- Categories ----------
        var cats = new[]
        {
            new InsuranceCategory { Slug = "health", Name = "Health Insurance", Description = "Hospital cover for you and your family, with cashless treatment." },
            new InsuranceCategory { Slug = "life", Name = "Life Insurance", Description = "Term cover that gives your family a lump sum when they need it." },
            new InsuranceCategory { Slug = "motor", Name = "Motor Insurance", Description = "Car and two-wheeler cover for damage, theft and third-party liability." },
            new InsuranceCategory { Slug = "travel", Name = "Travel Insurance", Description = "Medical emergencies, lost baggage and cancelled trips, at home or abroad." },
            new InsuranceCategory { Slug = "home", Name = "Home Insurance", Description = "Protect the building and your belongings from fire, theft and floods." }
        };
        db.Categories.AddRange(cats);
        db.SaveChanges();

        int CatId(string slug) => cats.First(c => c.Slug == slug).Id;

        InsurancePlan Plan(string cat, string provider, string name, long premium, long cover, int days,
                           string per, bool popular, string[] benefits, string[] exclusions) =>
            new InsurancePlan
            {
                CategoryId = CatId(cat),
                Provider = provider,
                Name = name,
                Premium = premium,
                CoverAmount = cover,
                DurationDays = days,
                PremiumPeriod = per,
                IsPopular = popular,
                IsActive = true,
                Benefits = string.Join("\n", benefits),
                Exclusions = string.Join("\n", exclusions)
            };

        var healthEx = new[] { "Cosmetic and dental treatment", "Pre-existing conditions in the first 2 years", "Non-accident claims in the first 30 days" };
        var lifeEx = new[] { "Suicide within the first year", "Death linked to undisclosed illness", "Death while committing a crime" };
        var motorEx = new[] { "Driving without a valid licence", "Damage while driving under the influence", "Normal wear and tear" };
        var travelEx = new[] { "Adventure sports", "Pre-existing illness", "Travel against a government advisory" };
        var homeEx = new[] { "Wear and tear", "Loss of cash and undeclared jewellery", "Damage from war or nuclear risk" };

        // ---------- Plans (fictional providers and prices) ----------
        var plans = new List<InsurancePlan>
        {
            Plan("health", "Suraksha Health", "Aarogya Basic", 6499, 500000, 365, "/year", false,
                new[] { "Cashless treatment at network hospitals", "Hospital stay covered 30 days before and 60 days after", "Day-care procedures included" }, healthEx),
            Plan("health", "Suraksha Health", "Aarogya Family Floater", 14999, 1000000, 365, "/year", true,
                new[] { "One cover shared by up to 4 family members", "Cashless treatment at network hospitals", "Free annual health check-up for every member" }, healthEx),
            Plan("health", "Suraksha Health", "Aarogya Senior Plus", 21999, 750000, 365, "/year", false,
                new[] { "Designed for ages 60 and above", "Home treatment and ambulance cover", "No upper age limit on renewal" }, healthEx),

            Plan("life", "Nirmaan Life", "Nirmaan Term 1 Cr", 11800, 10000000, 10950, "/year", false,
                new[] { "Lump sum paid to your nominee", "Accidental death benefit included", "Premiums may qualify for deduction under Section 80C" }, lifeEx),
            Plan("life", "Nirmaan Life", "Nirmaan Term 50L", 7200, 5000000, 9125, "/year", true,
                new[] { "Lump sum paid to your nominee", "Choose a 25-year cover period", "Waiver of premium on disability" }, lifeEx),
            Plan("life", "Nirmaan Life", "Nirmaan Return of Premium", 24500, 7500000, 10950, "/year", false,
                new[] { "Premiums refunded if you outlive the term", "Lump sum paid to your nominee", "Accidental death benefit included" }, lifeEx),

            Plan("motor", "Pathfinder General", "Car Comprehensive", 9800, 600000, 365, "/year", true,
                new[] { "Own damage from accidents, fire and theft", "Third-party liability included", "Cashless repairs at network garages" }, motorEx),
            Plan("motor", "Pathfinder General", "Car Third-Party", 2100, 750000, 365, "/year", false,
                new[] { "Legal cover for injury to third parties", "Third-party property damage", "Personal accident cover for the owner-driver" },
                new[] { "Damage to your own vehicle", "Driving without a valid licence", "Use in racing or speed tests" }),
            Plan("motor", "Pathfinder General", "Two-Wheeler Comprehensive", 1650, 100000, 365, "/year", false,
                new[] { "Own damage and theft cover", "Third-party liability included", "24x7 roadside assistance" }, motorEx),

            Plan("travel", "Wayfarer Assurance", "Domestic Trip Cover", 499, 100000, 30, "/trip", false,
                new[] { "Emergency medical expenses", "Loss of checked baggage", "Trip cancellation due to illness" }, travelEx),
            Plan("travel", "Wayfarer Assurance", "International Explorer", 1899, 2500000, 30, "/trip", true,
                new[] { "Overseas medical care and evacuation", "Passport loss assistance", "Flight delay compensation" },
                new[] { "Pregnancy-related costs", "Mental health treatment", "Countries under a travel advisory" }),
            Plan("travel", "Wayfarer Assurance", "Annual Multi-Trip", 4999, 5000000, 365, "/year", false,
                new[] { "Unlimited trips of up to 30 days each", "Overseas medical care and evacuation", "Lost baggage and passport cover" },
                new[] { "Adventure sports", "Pre-existing illness", "Trips longer than 30 days" }),

            Plan("home", "Griha Mutual", "Home Basic", 1200, 2000000, 365, "/year", false,
                new[] { "Fire and lightning damage", "Burglary and theft of contents", "Flood and storm damage" }, homeEx),
            Plan("home", "Griha Mutual", "Home Shield", 3400, 5000000, 365, "/year", false,
                new[] { "Building and contents covered", "Electrical and plumbing breakdown", "Fire, flood, theft and storm damage" }, homeEx),
            Plan("home", "Griha Mutual", "Home Shield Plus", 6200, 10000000, 365, "/year", false,
                new[] { "Higher cover for building and contents", "Alternate accommodation for up to 3 months", "Personal liability cover" }, homeEx)
        };
        db.Plans.AddRange(plans);
        db.SaveChanges();

        // ---------- Users (passwords are stored as BCrypt hashes) ----------
        var admin = new AppUser
        {
            Name = "LIK Admin", Email = "admin@lik.in", Phone = "9000000001", Role = Roles.Admin,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"), CreatedOn = new DateOnly(2026, 1, 5)
        };
        var arun = new AppUser
        {
            Name = "Arun Kumar", Email = "demo@lik.in", Phone = "9876543210", Role = Roles.User,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@123"), CreatedOn = new DateOnly(2026, 2, 14)
        };
        var priya = new AppUser
        {
            Name = "Priya Nair", Email = "priya@lik.in", Phone = "9812345678", Role = Roles.User,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Priya@123"), CreatedOn = new DateOnly(2026, 7, 21)
        };
        db.Users.AddRange(admin, arun, priya);
        db.SaveChanges();

        // ---------- Policies ----------
        InsurancePlan ByName(string name) => plans.First(p => p.Name == name);

        var p1 = new Policy { PolicyNumber = "LIK-2026-00411", UserId = arun.Id, PlanId = ByName("Aarogya Family Floater").Id, StartDate = new DateOnly(2026, 3, 1), EndDate = new DateOnly(2027, 2, 28) };
        var p2 = new Policy { PolicyNumber = "LIK-2026-00412", UserId = arun.Id, PlanId = ByName("Car Comprehensive").Id, StartDate = new DateOnly(2026, 6, 15), EndDate = new DateOnly(2027, 6, 14) };
        var p3 = new Policy { PolicyNumber = "LIK-2026-00413", UserId = priya.Id, PlanId = ByName("Two-Wheeler Comprehensive").Id, StartDate = new DateOnly(2026, 8, 10), EndDate = new DateOnly(2027, 8, 9) };
        db.Policies.AddRange(p1, p2, p3);
        db.SaveChanges();

        // ---------- Claims, each with its status history ----------
        var c1 = new InsuranceClaim
        {
            ClaimNumber = "CLM-1001", PolicyId = p1.Id, UserId = arun.Id,
            IncidentDate = new DateOnly(2026, 9, 12), Amount = 84500, CreatedOn = new DateOnly(2026, 9, 18),
            Description = "Admitted for 3 days with viral pneumonia at a network hospital. Discharge summary and bills are available.",
            DocumentName = "", Status = ClaimStatus.UnderReview,
            Remarks = "Hospital bills received. Verifying the discharge summary.",
            Events =
            {
                new ClaimEvent { Status = ClaimStatus.Submitted, Note = "", OccurredOn = new DateOnly(2026, 9, 18) },
                new ClaimEvent { Status = ClaimStatus.UnderReview, Note = "Hospital bills received. Verifying the discharge summary.", OccurredOn = new DateOnly(2026, 9, 21) }
            }
        };
        var c2 = new InsuranceClaim
        {
            ClaimNumber = "CLM-1002", PolicyId = p2.Id, UserId = arun.Id,
            IncidentDate = new DateOnly(2026, 8, 2), Amount = 18200, CreatedOn = new DateOnly(2026, 8, 4),
            Description = "Rear bumper and tail lamp damaged in a parking lot collision.",
            DocumentName = "", Status = ClaimStatus.Approved,
            Remarks = "Approved after depreciation. Payment sent to the garage.",
            Events =
            {
                new ClaimEvent { Status = ClaimStatus.Submitted, Note = "", OccurredOn = new DateOnly(2026, 8, 4) },
                new ClaimEvent { Status = ClaimStatus.UnderReview, Note = "Surveyor assigned.", OccurredOn = new DateOnly(2026, 8, 6) },
                new ClaimEvent { Status = ClaimStatus.Approved, Note = "Approved after depreciation. Payment sent to the garage.", OccurredOn = new DateOnly(2026, 8, 11) }
            }
        };
        var c3 = new InsuranceClaim
        {
            ClaimNumber = "CLM-1003", PolicyId = p3.Id, UserId = priya.Id,
            IncidentDate = new DateOnly(2026, 9, 28), Amount = 9500, CreatedOn = new DateOnly(2026, 9, 30),
            Description = "Front fork bent after a fall on a wet road. Garage estimate attached.",
            DocumentName = "", Status = ClaimStatus.Submitted, Remarks = "",
            Events =
            {
                new ClaimEvent { Status = ClaimStatus.Submitted, Note = "", OccurredOn = new DateOnly(2026, 9, 30) }
            }
        };
        db.Claims.AddRange(c1, c2, c3);
        db.SaveChanges();
    }
}
