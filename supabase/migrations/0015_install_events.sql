-- The install offer is only worth keeping if people accept it, and there is no
-- other way to find out: once a site is installed it opens straight into its
-- own window and never reports back. Three more event kinds make the whole
-- funnel visible — how many Android visitors were even eligible to be asked,
-- how many said yes, how many waved it away.
alter table public.events
  drop constraint if exists events_kind_check;

alter table public.events
  add constraint events_kind_check
  check (kind in (
    'visit', 'role', 'listing_open', 'call_click',
    'install_shown', 'install_accepted', 'install_dismissed'
  ));
