import { db, usersTable, rewardTransactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getSettingNumber } from "./settings";

export async function processSignupBonus(userId: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  
  if (user && user.isFirstLogin) {
    const signupBonus = await getSettingNumber('SIGNUP_BONUS_AMOUNT', 1000);
    
    await db.transaction(async (tx) => {
      // 1. Credit the user's balance
      await tx.update(usersTable)
        .set({ 
          pointsBalance: sql`${usersTable.pointsBalance} + ${signupBonus}`,
          isFirstLogin: false 
        })
        .where(eq(usersTable.id, userId));
      
      // 2. Log the transaction for transparency
      await tx.insert(rewardTransactionsTable).values({
        userId,
        amount: signupBonus,
        type: 'SIGNUP_BONUS',
        description: `Welcome bonus of ₹${signupBonus} credited on first login.`
      });
    });
    
    return signupBonus;
  }
  return 0;
}

export async function processReferralEarnings(referrerId: number, refereeUserId: number, bookingAmount: number, bookingId: number) {
  const referrerPercent = await getSettingNumber('REFERRAL_PERCENT_REFERRER', 5); // Default 5%
  const refereePercent = await getSettingNumber('REFERRAL_PERCENT_REFEREE', 2); // Default 2%
  
  const referrerEarning = (bookingAmount * referrerPercent) / 100;
  const refereeEarning = (bookingAmount * refereePercent) / 100;

  await db.transaction(async (tx) => {
    // 1. Credit Referrer
    await tx.update(usersTable)
      .set({ pointsBalance: sql`${usersTable.pointsBalance} + ${referrerEarning}` })
      .where(eq(usersTable.id, referrerId));
    
    await tx.insert(rewardTransactionsTable).values({
      userId: referrerId,
      amount: referrerEarning,
      type: 'REFERRAL_EARNING',
      relatedBookingId: bookingId,
      description: `Referral commission (${referrerPercent}%) from booking #${bookingId}.`
    });

    // 2. Credit Referee (The person who booked)
    await tx.update(usersTable)
      .set({ pointsBalance: sql`${usersTable.pointsBalance} + ${refereeEarning}` })
      .where(eq(usersTable.id, refereeUserId));

    await tx.insert(rewardTransactionsTable).values({
      userId: refereeUserId,
      amount: refereeEarning,
      type: 'REFERRAL_REBATE',
      relatedBookingId: bookingId,
      description: `Referral bonus (${refereePercent}%) for using a referral code on booking #${bookingId}.`
    });
  });
}
