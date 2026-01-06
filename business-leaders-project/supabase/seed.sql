-- Seed data for Business Leaders Wisdom

-- Insert Leaders
INSERT INTO leaders (id, name, slug, title, photo_url, photo_credit) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Steve Jobs', 'steve-jobs', 'Co-founder of Apple', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg/440px-Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg', 'Matthew Yohe, CC BY-SA 3.0'),
  ('22222222-2222-2222-2222-222222222222', 'Andrew Carnegie', 'andrew-carnegie', 'Steel Magnate & Philanthropist', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Andrew_Carnegie%2C_three-quarter_length_portrait%2C_seated%2C_facing_slightly_left%2C_1913-crop.jpg/440px-Andrew_Carnegie%2C_three-quarter_length_portrait%2C_seated%2C_facing_slightly_left%2C_1913-crop.jpg', 'Public Domain'),
  ('33333333-3333-3333-3333-333333333333', 'Warren Buffett', 'warren-buffett', 'Chairman of Berkshire Hathaway', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Warren_Buffett_KU_Visit.jpg/440px-Warren_Buffett_KU_Visit.jpg', 'Mark Hirschey, CC BY-SA 2.0'),
  ('44444444-4444-4444-4444-444444444444', 'Oprah Winfrey', 'oprah-winfrey', 'Media Executive & Philanthropist', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Oprah_in_2014.jpg/440px-Oprah_in_2014.jpg', 'https://www.flickr.com/photos/aphrodite-in-nyc, CC BY 2.0'),
  ('55555555-5555-5555-5555-555555555555', 'Jeff Bezos', 'jeff-bezos', 'Founder of Amazon', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Jeff_Bezos_visits_LAAFB_SMC_%283908618%29_%28cropped%29.jpeg/440px-Jeff_Bezos_visits_LAAFB_SMC_%283908618%29_%28cropped%29.jpeg', 'U.S. Air Force, Public Domain'),
  ('66666666-6666-6666-6666-666666666666', 'Ray Dalio', 'ray-dalio', 'Founder of Bridgewater Associates', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Ray_Dalio_at_the_World_Economic_Forum_2022_01_%28cropped%29.jpg/440px-Ray_Dalio_at_the_World_Economic_Forum_2022_01_%28cropped%29.jpg', 'World Economic Forum, CC BY-SA 2.0'),
  ('77777777-7777-7777-7777-777777777777', 'Mary Kay Ash', 'mary-kay-ash', 'Founder of Mary Kay Cosmetics', 'https://upload.wikimedia.org/wikipedia/en/9/98/Mary_Kay_Ash.jpg', 'Fair use'),
  ('88888888-8888-8888-8888-888888888888', 'Richard Branson', 'richard-branson', 'Founder of Virgin Group', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Richard_Branson_March_2015_%28cropped%29.jpg/440px-Richard_Branson_March_2015_%28cropped%29.jpg', 'Chatham House, CC BY 2.0'),
  ('99999999-9999-9999-9999-999999999999', 'Sam Walton', 'sam-walton', 'Founder of Walmart', 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Sam_Walton.jpg', 'Public Domain'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Elon Musk', 'elon-musk', 'CEO of Tesla & SpaceX', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/440px-Elon_Musk_Royal_Society_%28crop2%29.jpg', 'The Royal Society, CC BY-SA 3.0');

-- Insert Nuggets for Steve Jobs
INSERT INTO nuggets (leader_id, text, topic_tags, type, source_title, confidence, status) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Stay hungry. Stay foolish.', ARRAY['motivation', 'mindset'], 'quote', 'Stanford Commencement Speech 2005', 'verified', 'published'),
  ('11111111-1111-1111-1111-111111111111', 'Innovation distinguishes between a leader and a follower.', ARRAY['innovation', 'leadership'], 'quote', 'The Innovation Secrets of Steve Jobs', 'attributed', 'published'),
  ('11111111-1111-1111-1111-111111111111', 'Design is not just what it looks like and feels like. Design is how it works.', ARRAY['design', 'product'], 'quote', 'New York Times Interview 2003', 'verified', 'published'),
  ('11111111-1111-1111-1111-111111111111', 'Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.', ARRAY['work', 'purpose', 'motivation'], 'quote', 'Stanford Commencement Speech 2005', 'verified', 'published'),
  ('11111111-1111-1111-1111-111111111111', 'Focus means saying no to the hundred other good ideas.', ARRAY['focus', 'strategy', 'decision-making'], 'quote', 'Apple Worldwide Developers Conference 1997', 'verified', 'published');

-- Insert Nuggets for Andrew Carnegie
INSERT INTO nuggets (leader_id, text, topic_tags, type, source_title, confidence, status) VALUES
  ('22222222-2222-2222-2222-222222222222', 'No man becomes rich unless he enriches others.', ARRAY['wealth', 'service'], 'quote', 'The Gospel of Wealth', 'verified', 'published'),
  ('22222222-2222-2222-2222-222222222222', 'The man who dies rich dies disgraced.', ARRAY['wealth', 'philanthropy'], 'quote', 'The Gospel of Wealth', 'verified', 'published'),
  ('22222222-2222-2222-2222-222222222222', 'Teamwork is the ability to work together toward a common vision.', ARRAY['teamwork', 'leadership'], 'quote', 'Various speeches', 'attributed', 'published'),
  ('22222222-2222-2222-2222-222222222222', 'Do your duty and a little more and the future will take care of itself.', ARRAY['work-ethic', 'discipline'], 'quote', 'Autobiography', 'verified', 'published'),
  ('22222222-2222-2222-2222-222222222222', 'The first man gets the oyster, the second man gets the shell.', ARRAY['competition', 'timing'], 'quote', 'Various writings', 'attributed', 'published');

-- Insert Nuggets for Warren Buffett
INSERT INTO nuggets (leader_id, text, topic_tags, type, source_title, confidence, status) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1.', ARRAY['investing', 'risk'], 'quote', 'Berkshire Hathaway Shareholder Letters', 'verified', 'published'),
  ('33333333-3333-3333-3333-333333333333', 'Be fearful when others are greedy and greedy when others are fearful.', ARRAY['investing', 'contrarian', 'psychology'], 'quote', 'Berkshire Hathaway Shareholder Letter 2004', 'verified', 'published'),
  ('33333333-3333-3333-3333-333333333333', 'Price is what you pay. Value is what you get.', ARRAY['investing', 'value'], 'quote', 'Berkshire Hathaway Shareholder Letters', 'verified', 'published'),
  ('33333333-3333-3333-3333-333333333333', 'It takes 20 years to build a reputation and five minutes to ruin it.', ARRAY['reputation', 'integrity'], 'quote', 'Various interviews', 'attributed', 'published'),
  ('33333333-3333-3333-3333-333333333333', 'The best investment you can make is in yourself.', ARRAY['self-improvement', 'learning'], 'quote', 'Various speeches', 'attributed', 'published');

-- Insert Nuggets for Oprah Winfrey
INSERT INTO nuggets (leader_id, text, topic_tags, type, source_title, confidence, status) VALUES
  ('44444444-4444-4444-4444-444444444444', 'The biggest adventure you can take is to live the life of your dreams.', ARRAY['dreams', 'courage', 'life'], 'quote', 'The Oprah Winfrey Show', 'attributed', 'published'),
  ('44444444-4444-4444-4444-444444444444', 'Turn your wounds into wisdom.', ARRAY['resilience', 'growth', 'learning'], 'quote', 'Various speeches', 'attributed', 'published'),
  ('44444444-4444-4444-4444-444444444444', 'Surround yourself with only people who are going to lift you higher.', ARRAY['relationships', 'environment'], 'quote', 'O Magazine', 'attributed', 'published'),
  ('44444444-4444-4444-4444-444444444444', 'Think like a queen. A queen is not afraid to fail.', ARRAY['confidence', 'failure', 'mindset'], 'quote', 'Various speeches', 'attributed', 'published'),
  ('44444444-4444-4444-4444-444444444444', 'The more you praise and celebrate your life, the more there is in life to celebrate.', ARRAY['gratitude', 'positivity'], 'quote', 'The Oprah Winfrey Show', 'attributed', 'published');

-- Insert Nuggets for Jeff Bezos
INSERT INTO nuggets (leader_id, text, topic_tags, type, source_title, confidence, status) VALUES
  ('55555555-5555-5555-5555-555555555555', 'Your brand is what people say about you when you''re not in the room.', ARRAY['branding', 'reputation'], 'quote', 'Various interviews', 'attributed', 'published'),
  ('55555555-5555-5555-5555-555555555555', 'If you double the number of experiments you do per year, you''re going to double your inventiveness.', ARRAY['innovation', 'experimentation'], 'quote', 'Amazon Shareholder Letters', 'verified', 'published'),
  ('55555555-5555-5555-5555-555555555555', 'We are stubborn on vision. We are flexible on details.', ARRAY['strategy', 'adaptability', 'vision'], 'quote', 'Amazon Shareholder Letters', 'verified', 'published'),
  ('55555555-5555-5555-5555-555555555555', 'If you''re competitor-focused, you have to wait until there is a competitor doing something. Being customer-focused allows you to be more pioneering.', ARRAY['customer', 'strategy', 'innovation'], 'quote', 'Interview with Charlie Rose', 'verified', 'published'),
  ('55555555-5555-5555-5555-555555555555', 'Work hard, have fun, make history.', ARRAY['work', 'culture', 'mission'], 'quote', 'Amazon company motto', 'verified', 'published');

-- Insert Nuggets for Ray Dalio
INSERT INTO nuggets (leader_id, text, topic_tags, type, source_title, confidence, status) VALUES
  ('66666666-6666-6666-6666-666666666666', 'Pain plus reflection equals progress.', ARRAY['growth', 'learning', 'resilience'], 'principle', 'Principles: Life and Work', 'verified', 'published'),
  ('66666666-6666-6666-6666-666666666666', 'He who lives by the crystal ball will eat shattered glass.', ARRAY['forecasting', 'humility', 'uncertainty'], 'quote', 'Principles: Life and Work', 'verified', 'published'),
  ('66666666-6666-6666-6666-666666666666', 'Embrace reality and deal with it.', ARRAY['realism', 'mindset'], 'principle', 'Principles: Life and Work', 'verified', 'published'),
  ('66666666-6666-6666-6666-666666666666', 'Don''t let fears of what others think of you stand in your way.', ARRAY['courage', 'authenticity'], 'principle', 'Principles: Life and Work', 'verified', 'published'),
  ('66666666-6666-6666-6666-666666666666', 'Radical transparency and radical truth are fundamental to meaningful work and meaningful relationships.', ARRAY['transparency', 'honesty', 'relationships'], 'principle', 'Principles: Life and Work', 'verified', 'published');

-- Insert Nuggets for Mary Kay Ash
INSERT INTO nuggets (leader_id, text, topic_tags, type, source_title, confidence, status) VALUES
  ('77777777-7777-7777-7777-777777777777', 'Pretend that every single person you meet has a sign around his or her neck that says, ''Make me feel important.''', ARRAY['leadership', 'relationships', 'empathy'], 'principle', 'Mary Kay on People Management', 'verified', 'published'),
  ('77777777-7777-7777-7777-777777777777', 'A company is only as good as the people it keeps.', ARRAY['hiring', 'team', 'culture'], 'quote', 'Various speeches', 'attributed', 'published'),
  ('77777777-7777-7777-7777-777777777777', 'Don''t limit yourself. Many people limit themselves to what they think they can do.', ARRAY['potential', 'mindset', 'growth'], 'quote', 'Miracles Happen', 'attributed', 'published'),
  ('77777777-7777-7777-7777-777777777777', 'There are two things people want more than sex and money: recognition and praise.', ARRAY['motivation', 'recognition', 'leadership'], 'quote', 'Mary Kay on People Management', 'attributed', 'published'),
  ('77777777-7777-7777-7777-777777777777', 'We fall forward to succeed.', ARRAY['failure', 'persistence', 'growth'], 'quote', 'Various speeches', 'attributed', 'published');

-- Insert Nuggets for Richard Branson
INSERT INTO nuggets (leader_id, text, topic_tags, type, source_title, confidence, status) VALUES
  ('88888888-8888-8888-8888-888888888888', 'Screw it, let''s do it.', ARRAY['action', 'risk', 'entrepreneurship'], 'quote', 'Screw It, Let''s Do It', 'verified', 'published'),
  ('88888888-8888-8888-8888-888888888888', 'Train people well enough so they can leave, treat them well enough so they don''t want to.', ARRAY['leadership', 'team', 'culture'], 'quote', 'Various interviews', 'attributed', 'published'),
  ('88888888-8888-8888-8888-888888888888', 'Business opportunities are like buses, there''s always another one coming.', ARRAY['opportunity', 'patience', 'entrepreneurship'], 'quote', 'Losing My Virginity', 'attributed', 'published'),
  ('88888888-8888-8888-8888-888888888888', 'The best way of learning about anything is by doing.', ARRAY['learning', 'action', 'experience'], 'quote', 'Losing My Virginity', 'attributed', 'published'),
  ('88888888-8888-8888-8888-888888888888', 'If somebody offers you an amazing opportunity but you are not sure you can do it, say yes – then learn how to do it later.', ARRAY['opportunity', 'risk', 'growth'], 'quote', 'Various interviews', 'attributed', 'published');

-- Insert Nuggets for Sam Walton
INSERT INTO nuggets (leader_id, text, topic_tags, type, source_title, confidence, status) VALUES
  ('99999999-9999-9999-9999-999999999999', 'There is only one boss. The customer.', ARRAY['customer', 'service'], 'quote', 'Made in America', 'verified', 'published'),
  ('99999999-9999-9999-9999-999999999999', 'High expectations are the key to everything.', ARRAY['expectations', 'standards', 'excellence'], 'quote', 'Made in America', 'verified', 'published'),
  ('99999999-9999-9999-9999-999999999999', 'Celebrate your successes. Find some humor in your failures.', ARRAY['success', 'failure', 'culture'], 'quote', 'Made in America', 'verified', 'published'),
  ('99999999-9999-9999-9999-999999999999', 'Outstanding leaders go out of their way to boost the self-esteem of their personnel.', ARRAY['leadership', 'motivation', 'team'], 'quote', 'Made in America', 'verified', 'published'),
  ('99999999-9999-9999-9999-999999999999', 'Capital isn''t scarce; vision is.', ARRAY['vision', 'entrepreneurship'], 'quote', 'Made in America', 'verified', 'published');

-- Insert Nuggets for Elon Musk
INSERT INTO nuggets (leader_id, text, topic_tags, type, source_title, confidence, status) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'When something is important enough, you do it even if the odds are not in your favor.', ARRAY['persistence', 'conviction', 'risk'], 'quote', 'Various interviews', 'attributed', 'published'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Failure is an option here. If things are not failing, you are not innovating enough.', ARRAY['failure', 'innovation', 'risk'], 'quote', 'SpaceX talks', 'attributed', 'published'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'I think it''s very important to have a feedback loop, where you''re constantly thinking about what you''ve done and how you could be doing it better.', ARRAY['feedback', 'improvement', 'learning'], 'quote', 'Various interviews', 'attributed', 'published'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Persistence is very important. You should not give up unless you are forced to give up.', ARRAY['persistence', 'resilience'], 'quote', 'USC Commencement Speech 2014', 'verified', 'published'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Some people don''t like change, but you need to embrace change if the alternative is disaster.', ARRAY['change', 'adaptability'], 'quote', 'Various interviews', 'attributed', 'published');
