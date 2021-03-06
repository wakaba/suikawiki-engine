package SWE::DB::IDGenerator;
use strict;

require SWE::DB::Lock;

sub new ($) {
  my $self = bless {
    'file_name' => 'nextid.dat',
    'lock_file_name' => 'nextid.lock',
  }, shift;
  return $self;
} # new

sub get_next_id ($) {
  my $self = shift;
  my $lock = SWE::DB::Lock->new;
  $lock->lock_type ('IDs');
  $lock->{file_name} = $self->{lock_file_name};
  $lock->lock;
  my $nextid = 1;
  if (-f $self->{file_name}) {
    open my $file, '<', $self->{file_name} or die "$0: $self->{file_name}: $!";
    $nextid = <$file> + 0;
  }
  open my $file, '>', $self->{file_name} or die "$0: $self->{file_name}: $!";
  print $file ($nextid + 1);
  $lock->unlock;
  return $nextid;
} # get_next_id

sub get_last_id ($) {
  my $self = shift;
  my $currentid = 0;
  if (-f $self->{file_name}) {
    open my $file, '<', $self->{file_name} or die "$0: $self->{file_name}: $!";
    $currentid = <$file> - 1;
  }
  return $currentid;
} # get_current_id

1;
